# Twitter MCP Server for Claude Desktop

A Model Context Protocol (MCP) server that enables Claude Desktop to interact with Twitter - post tweets, analyze content, and create well-structured tweets based on prompts.

## Overview

This MCP server connects Claude Desktop to Twitter via the Twitter API, providing several capabilities:

- **Resources**: Access your Twitter profile, recent tweets, and trending topics
- **Tools**: Post tweets, delete tweets, and analyze tweet content
- **Prompts**: Templates for creating concise tweets, Twitter threads, and engagement-focused content

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Claude Desktop](https://www.anthropic.com/claude/download)
- Twitter Developer Account with API keys

## Installation

1. Clone or download this repository
   ```
   git clone https://github.com/yourusername/twitter-mcp-server
   cd twitter-mcp-server
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the project root with your Twitter API credentials
   ```
   TWITTER_API_KEY=your_api_key
   TWITTER_API_SECRET=your_api_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_SECRET=your_access_secret
   ```

## Setup with Claude Desktop

1. Open Claude Desktop and access settings (from the Claude menu, not in-app)
2. Click on "Developer" in the left sidebar, then "Edit Config"
3. Add the Twitter MCP server to your configuration:

```json
{
    "mcpServers": {
        "Twitter Assistant": {
            "command": "npm",
            "args": [
                "--prefix",
                "/full/path/to/twitter-mcp-server.js",
                "start"
            ]
        }
    }
}
```

4. Replace `/full/path/to/twitter-mcp-server.js` with the actual path to your server file
5. Save the configuration file and restart Claude Desktop

## Features

### Resources

- **User Profile** (`twitter://user/profile`): Get information about your Twitter profile
- **Recent Tweets** (`twitter://user/tweets`): Retrieve your most recent tweets
- **Trending Topics** (`twitter://trends`): Fetch current trending topics

### Tools

- **Post Tweet**: Publish a new tweet with content validation
  - Parameters: `content` (string, max 280 chars), `dryRun` (boolean, optional)

- **Delete Tweet**: Remove a tweet by ID
  - Parameters: `tweetId` (string)

- **Analyze Tweet**: Check engagement potential of tweet content
  - Parameters: `content` (string, max 280 chars)

### Prompts

- **Concise Tweet**: Create short, focused tweets
  - Parameters: `topic` (string), `include_hashtags` (boolean), `tone` (enum: professional, casual, humorous)

- **Twitter Thread**: Generate multi-tweet threads
  - Parameters: `topic` (string), `points` (number, 2-5), `include_call_to_action` (boolean)

- **Engagement Tweet**: Create tweets designed for high engagement
  - Parameters: `topic` (string), `engagement_type` (enum: question, poll, hot-take, useful-tip)

## Usage Examples

Once configured, you can ask Claude Desktop:

- "What are the current trending topics on Twitter?"
- "Draft a professional tweet about artificial intelligence"
- "Create a Twitter thread about climate change with 3 points"
- "Analyze this tweet: [your tweet content]"
- "Post this tweet: Just learned how to connect Claude with Twitter!"

## File Structure

```
twitter-mcp-server/
├── twitter-mcp-server.js  # Main server file
├── .env                   # Environment variables (API keys)
├── package.json           # Project dependencies
└── README.md              # This file
```

## Troubleshooting

- **Twitter API Errors**: Verify your API credentials and permissions
- **Server Not Found**: Check that the path in your configuration is correct
- **Module Not Found**: Ensure all dependencies are installed (`npm install`)
- **Connection Issues**: Make sure Claude Desktop is restarted after configuration changes

## Security Note

This server runs with the permissions of your user account. It will ask for confirmation before posting or deleting tweets, but always review actions before approving them.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.