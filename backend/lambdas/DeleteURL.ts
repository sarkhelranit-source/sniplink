import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
        const shortcode = event.pathParameters?.shortcode;
        const userId = (event.requestContext as any)?.authorizer?.jwt?.claims?.sub as string | undefined;

        if (!shortcode) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Shortcode is missing from the path." })
            };
        }

        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: "Unauthorized: Missing user ID." })
            };
        }

        // 1. Verify ownership before deleting
        const getResponse = await docClient.send(new GetCommand({
            TableName: "url-shortener-table",
            Key: {
                shortcode: shortcode
            }
        }));

        if (!getResponse.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Not Found: The requested short link does not exist." })
            };
        }

        if (getResponse.Item.userId !== userId) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: "Forbidden: You do not have permission to delete this link." })
            };
        }

        // 2. Delete the item
        await docClient.send(new DeleteCommand({
            TableName: "url-shortener-table",
            Key: {
                shortcode: shortcode
            }
        }));

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Link deleted successfully." })
        };
    } catch (error) {
        console.error("Error deleting URL:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
