const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { aws } = require('Config/services');

// Add VPC endpoint as we are connecting from a private VPC
const client = new SQSClient({ endpoint: `https://sqs.${aws.region}.amazonaws.com` });

const sendMessage = async (queueUrl, bodyValue) => {
  const params = {
    MessageBody: JSON.stringify({ bodyValue }),
    QueueUrl: queueUrl,
  };
  const command = new SendMessageCommand(params);

  try {
    const response = await client.send(command);
    console.log(response);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  sendMessage,
};
