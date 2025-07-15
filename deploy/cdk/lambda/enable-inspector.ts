import { Inspector2Client, EnableCommand } from "@aws-sdk/client-inspector2";
import { CloudFormationCustomResourceEvent } from "aws-lambda";

const client = new Inspector2Client({});

export const handler = async (event: CloudFormationCustomResourceEvent) => {
  console.log("Received event:", JSON.stringify(event));

  if (event.RequestType === 'Delete') {
    return { PhysicalResourceId: "EnableInspector2" };
  }

  try {
    const command = new EnableCommand({
      resourceTypes: ["EC2", "ECR", "LAMBDA"],
    });

    await client.send(command);
    console.log("Amazon Inspector2 enabled");

    return {
      PhysicalResourceId: "EnableInspector2",
    };
  } catch (error) {
    console.error("Failed to enable Inspector2", error);
    throw error;
  }
};
