import { CustomResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CustomStack, CustomStackProps } from './stack';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as chatbot from 'aws-cdk-lib/aws-chatbot';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';

export class inspectorStack extends CustomStack {
  constructor(scope: Construct, props: CustomStackProps, stackName: string) {
    super(scope, props, stackName);
    new InspectorStack(this, props, stackName);
  }
}
export class InspectorStack extends Construct {
  constructor(scope: CustomStack, props: CustomStackProps, stackName: string) {
    super(scope, stackName);

    // 1. Create SNS Topic
    const topic = new sns.Topic(this, 'InspectorAlertsTopic', {
      topicName: 'InspectorAlerts'
    });

    // 2. EventBridge Rule to capture Inspector2 Findings
    const rule = new events.Rule(this, 'Inspector2FindingRule', {
      eventPattern: {
        source: ['aws.inspector2'],
        detailType: ['Inspector2 Finding'],
        detail: {
          severity: [{ exists: true }],
        },
      },
    });
    rule.addTarget(new targets.SnsTopic(topic));

    // 3. IAM Role for AWS Chatbot
    const chatbotRole = new iam.Role(this, 'ChatbotRole', {
      assumedBy: new iam.ServicePrincipal('chatbot.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
      ],
    });

    // 4. AWS Chatbot to Slack
    new chatbot.SlackChannelConfiguration(this, 'InspectorSlackAlertChannel', {
      slackChannelConfigurationName: 'InspectorSlackAlert',
      slackWorkspaceId: 'T06BM7XREGJ',
      slackChannelId: 'C08BF5L15QT',
      notificationTopics: [topic],
      role: chatbotRole,
    });

    new AwsCustomResource(this, 'EnableInspector2', {
      onCreate: {
        service: 'Inspector2',
        action: 'enable',
        parameters: {
          resourceTypes: ['EC2', 'ECR', 'LAMBDA', 'LAMBDA_CODE'],
        },
        physicalResourceId: PhysicalResourceId.of('Inspector2Enabled'),
      },
      policy: AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: [
            'inspector2:Enable',
            'iam:CreateServiceLinkedRole',
          ],
          resources: ['*'],
          conditions: {
            StringEqualsIfExists: {
              'iam:AWSServiceName': 'inspector2.amazonaws.com',
            },
          },
        }),
      ]),
    });                 
  }
}