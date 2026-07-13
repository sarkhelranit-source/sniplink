import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const shortcode = event.pathParameters?.shortcode;

        if (!shortcode) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Shortcode is missing from the path." })
            };
        }

        const response = await docClient.send(new GetCommand({
            TableName: "url-shortener-table",
            Key: {
                shortcode: shortcode
            }
        }));

        if (!response.Item) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "text/html" },
                body: "<h1>404 Not Found</h1><p>The requested short link does not exist.</p>"
            };
        }

        const item = response.Item;

        // 1. Expiration Check
        if (item.expiresAt) {
            const now = new Date();
            const expires = new Date(item.expiresAt);
            if (now > expires) {
                return {
                    statusCode: 410,
                    headers: { "Content-Type": "text/html" },
                    body: `
                        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                            <h1>Link Expired</h1>
                            <p>This link has reached its expiration date and is no longer available.</p>
                        </div>
                    `
                };
            }
        }

        // 2. Password Check
        if (item.passwordHash) {
            const queryPwd = event.queryStringParameters?.pwd;
            let authenticated = false;

            if (queryPwd) {
                const [salt, hash] = item.passwordHash.split(':');
                const verifyHash = crypto.scryptSync(queryPwd, salt, 64).toString('hex');
                if (verifyHash === hash) {
                    authenticated = true;
                }
            }

            if (!authenticated) {
                return {
                    statusCode: 200,
                    headers: { "Content-Type": "text/html" },
                    body: `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Password Protected Link</title>
                            <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                                .card { background-color: #1e293b; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #334155; width: 100%; max-width: 400px; text-align: center; }
                                h1 { margin-top: 0; font-size: 1.5rem; margin-bottom: 0.5rem; color: #f8fafc; }
                                p { color: #94a3b8; margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.5; }
                                input { width: 100%; padding: 0.875rem 1rem; margin-bottom: 1.5rem; border-radius: 0.5rem; border: 1px solid #334155; background: #0f172a; color: white; box-sizing: border-box; font-size: 1rem; transition: border-color 0.2s; }
                                input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
                                button { width: 100%; padding: 0.875rem; background-color: #6366f1; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 1rem; transition: background-color 0.2s; }
                                button:hover { background-color: #4f46e5; }
                                .error { background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.875rem; }
                            </style>
                        </head>
                        <body>
                            <div class="card">
                                <h1>Protected Link</h1>
                                <p>The creator of this link has secured it with a password. Please enter it below to continue.</p>
                                ${queryPwd ? '<div class="error">Incorrect password. Please try again.</div>' : ''}
                                <form id="pwdForm">
                                    <input type="password" id="pwd" placeholder="Enter password" required autofocus>
                                    <button type="submit">Unlock Link</button>
                                </form>
                            </div>
                            <script>
                                document.getElementById('pwdForm').addEventListener('submit', function(e) {
                                    e.preventDefault();
                                    const pwd = document.getElementById('pwd').value;
                                    window.location.href = window.location.pathname + '?pwd=' + encodeURIComponent(pwd);
                                });
                            </script>
                        </body>
                        </html>
                    `
                };
            }
        }

        return {
            statusCode: 301,
            headers: {
                Location: item.originalUrl,
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        };

    } catch (error) {
        console.error("Error redirecting:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
