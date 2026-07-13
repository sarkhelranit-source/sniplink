import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body || "{}");
        const originalUrl = body.url;

        if (!originalUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "The 'url' property is required in the JSON body." })
            };
        }

        // 1. Custom Alias or Random Shortcode
        let shortcode = body.customAlias;
        if (!shortcode) {
            shortcode = crypto.randomBytes(4).toString('base64url').substring(0, 6);
        } else {
            if (!/^[a-zA-Z0-9-_]{3,30}$/.test(shortcode)) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Custom alias must be 3-30 characters long and contain only alphanumeric characters, dashes, and underscores." })
                };
            }
        }

        const userId = (event.requestContext as any)?.authorizer?.jwt?.claims?.sub as string | undefined;

        const item: any = {
            shortcode: shortcode,
            originalUrl: originalUrl,
            createdAt: new Date().toISOString()
        };

        if (userId) {
            item.userId = userId;
        }

        // 2. Link Expiration
        if (body.expiresAt) {
            item.expiresAt = body.expiresAt;
        }

        // 3. Tags
        if (Array.isArray(body.tags) && body.tags.length > 0) {
            item.tags = body.tags;
        }

        // 4. Password Protection
        if (body.password) {
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.scryptSync(body.password, salt, 64).toString('hex');
            item.passwordHash = `${salt}:${hash}`;
        }

        // Store the mapping in DynamoDB
        try {
            await docClient.send(new PutCommand({
                TableName: "url-shortener-table",
                Item: item,
                ConditionExpression: "attribute_not_exists(shortcode)"
            }));
        } catch (e: any) {
            if (e.name === "ConditionalCheckFailedException") {
                return {
                    statusCode: 409,
                    body: JSON.stringify({ message: "That custom alias is already taken. Please choose another one." })
                };
            }
            throw e;
        }

        const domainName = event.requestContext?.domainName || "yourdomain.com";
        const shortUrl = `https://${domainName}/${shortcode}`;

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                shortcode: shortcode,
                originalUrl: originalUrl,
                shortUrl: shortUrl
            })
        };
    } catch (error) {
        console.error("Error creating short URL:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
