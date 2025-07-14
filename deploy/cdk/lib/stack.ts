import { Construct } from 'constructs';
import {
    StackProps,
    Stack,
    DefaultStackSynthesizer,
} from 'aws-cdk-lib';


export interface CustomStackProps extends StackProps {
    readonly projectName: string;
    readonly gitRevision: string;
    readonly projectEnvironment?: string;
}

export class CustomStack extends Stack {
    public readonly projectName: string;
    public readonly gitRevision: string;
    public readonly projectEnvironment?: string;
    public constructor(
        scope: Construct,
        props: CustomStackProps,
        stackName: string,
    ) {
        const overriddenProps = Object.assign(
            {
                synthesizer: new DefaultStackSynthesizer({
                    generateBootstrapVersionRule: false,
                }),
            },
            props
        );

        super(scope, stackName, overriddenProps);

        if (props.gitRevision === undefined) {
            throw new Error('Git Revision must be provided');
        }

        this.gitRevision = props.gitRevision;
        this.projectName = props.projectName;
        this.projectEnvironment = props.projectEnvironment;

        if (props.projectEnvironment) {
            this.tags.setTag('Environment', props.projectEnvironment);
        }

        this.tags.setTag('Project', props.projectName);
        this.tags.setTag('GitRevision', props.gitRevision);
        this.tags.setTag('StackName', stackName);

    }
}
