import * as dotenv from 'dotenv';
dotenv.config();

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TwitterApi } from "twitter-api-v2";

// Configuration
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || "";
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || "";
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || "";
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET || "";

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: TWITTER_API_KEY,
  appSecret: TWITTER_API_SECRET,
  accessToken: TWITTER_ACCESS_TOKEN,
  accessSecret: TWITTER_ACCESS_SECRET,
});

// Create MCP server
const server = new McpServer({
  name: "Twitter Assistant",
  version: "1.0.0",
});

// Resources - User profile
server.resource(
  "user-profile",
  "twitter://user/profile",
  async (uri) => {
    try {
      const me = await twitterClient.v2.me({
        "user.fields": ["description", "public_metrics", "created_at"]
      });
      
      return {
        contents: [{
          uri: uri.href,
          text: `Twitter Profile:\nUsername: @${me.data.username}\nName: ${me.data.name}\nBio: ${me.data.description}\nFollowers: ${me.data.public_metrics?.followers_count}\nFollowing: ${me.data.public_metrics?.following_count}\nJoined: ${me.data.created_at}`
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error fetching profile: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// Resources - Recent tweets
server.resource(
  "recent-tweets",
  "twitter://user/tweets",
  async (uri) => {
    try {
      const tweets = await twitterClient.v2.userTimeline(
        await twitterClient.v2.me().then(me => me.data.id),
        { max_results: 10 }
      );
      
      const tweetList = tweets.data.data.map(tweet => 
        `• ${tweet.text.replace(/\n/g, ' ')} [${new Date(tweet.created_at || "").toLocaleString()}]`
      ).join('\n\n');
      
      return {
        contents: [{
          uri: uri.href,
          text: `Recent Tweets:\n\n${tweetList}`
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error fetching tweets: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// Resources - Twitter trending topics
server.resource(
  "trending-topics",
  "twitter://trends",
  async (uri) => {
    try {
      // Get WOEID for worldwide trends
      const trends = await twitterClient.v1.trendingTopics(1); // 1 = worldwide
      
      const trendList = trends[0].trends
        .slice(0, 15)
        .map(trend => `• ${trend.name} - ${trend.tweet_volume ? trend.tweet_volume.toLocaleString() + ' tweets' : 'volume unknown'}`)
        .join('\n');
      
      return {
        contents: [{
          uri: uri.href,
          text: `Current Trending Topics:\n\n${trendList}`
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error fetching trends: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// Tool - Post a tweet
server.tool(
  "post-tweet",
  { 
    content: z.string().max(280, "Tweet content cannot exceed 280 characters"),
    dryRun: z.boolean().default(false).optional()
  },
  async ({ content, dryRun }) => {
    if (dryRun) {
      return {
        content: [{ 
          type: "text", 
          text: `[DRY RUN] Tweet prepared (${content.length}/280 chars):\n"${content}"` 
        }]
      };
    }
    
    try {
      const result = await twitterClient.v2.tweet(content);
      return {
        content: [{ 
          type: "text", 
          text: `Tweet posted successfully! Tweet ID: ${result.data.id}\n"${content}"` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error posting tweet: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Tool - Delete a tweet
server.tool(
  "delete-tweet",
  { tweetId: z.string() },
  async ({ tweetId }) => {
    try {
      await twitterClient.v2.deleteTweet(tweetId);
      return {
        content: [{ 
          type: "text", 
          text: `Tweet ${tweetId} deleted successfully` 
        }]
      };
    } catch (error) {
      return {
        content: [{ 
          type: "text", 
          text: `Error deleting tweet: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true
      };
    }
  }
);

// Tool - Analyze tweet sentiment and engagement potential
server.tool(
  "analyze-tweet",
  { 
    content: z.string().max(280, "Tweet content cannot exceed 280 characters")
  },
  async ({ content }) => {
    // This is a mock implementation. In a real scenario, you might:
    // 1. Use a sentiment analysis API
    // 2. Check for optimized hashtag usage
    // 3. Verify link formatting
    // 4. Check best practices for engagement
    
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const charCount = content.length;
    const hashtags = (content.match(/#\w+/g) || []).length;
    const urls = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    const mentions = (content.match(/@\w+/g) || []).length;
    
    // Simple scoring algorithm
    let score = 70; // Base score
    
    // Adjust based on length
    if (charCount < 100) score += 5;
    if (charCount > 200) score -= 10;
    
    // Adjust based on hashtags
    if (hashtags === 0) score -= 5;
    if (hashtags > 3) score -= 10;
    
    // Adjust based on mentions
    if (mentions > 2) score -= 5;
    
    // Cap score range
    score = Math.max(0, Math.min(100, score));
    
    return {
      content: [{ 
        type: "text", 
        text: `Tweet Analysis:
- Characters: ${charCount}/280
- Words: ${wordCount}
- Hashtags: ${hashtags}
- URLs: ${urls}
- Mentions: ${mentions}

Engagement Score: ${score}/100

Recommendations:
${hashtags === 0 ? "- Consider adding 1-2 relevant hashtags\n" : ""}
${hashtags > 3 ? "- Too many hashtags may reduce engagement\n" : ""}
${charCount > 200 ? "- Slightly shorter tweets often perform better\n" : ""}
${mentions > 2 ? "- Multiple mentions may dilute your message\n" : ""}
` 
      }]
    };
  }
);

// Prompt - Create a concise tweet
server.prompt(
  "concise-tweet",
  { 
    topic: z.string(),
    include_hashtags: z.boolean().default(true).optional(),
    tone: z.enum(["professional", "casual", "humorous"]).default("professional").optional()
  },
  ({ topic, include_hashtags, tone }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Create a concise tweet about ${topic}. 
The tweet should be under 200 characters, clear and engaging.
${include_hashtags ? "Include 1-2 relevant hashtags." : "Do not include hashtags."}
Use a ${tone} tone.
Focus on one main point or insight.`
      }
    }]
  })
);

// Prompt - Create a thread
server.prompt(
  "twitter-thread",
  { 
    topic: z.string(),
    points: z.number().min(2).max(5).default(3).optional(),
    include_call_to_action: z.boolean().default(true).optional()
  },
  ({ topic, points, include_call_to_action }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Create a Twitter thread about ${topic} with ${points} tweets.
Each tweet should be self-contained but flow naturally into the next one.
Keep each tweet under 240 characters to allow for threading.
Use a conversational yet informative tone.
Start with a hook to grab attention.
${include_call_to_action ? "End with a call to action or question." : ""}
Format as:
Tweet 1: [content]
Tweet 2: [content]
...`
      }
    }]
  })
);

// Prompt - Create engagement tweet
server.prompt(
  "engagement-tweet",
  { 
    topic: z.string(),
    engagement_type: z.enum(["question", "poll", "hot-take", "useful-tip"]).default("question").optional()
  },
  ({ topic, engagement_type }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Create an engaging tweet about ${topic} designed to maximize replies and interaction.
Use a ${engagement_type} format.
${engagement_type === "question" ? "Ask an open-ended question that encourages responses." : ""}
${engagement_type === "poll" ? "Phrase it as a Twitter poll with clear options." : ""}
${engagement_type === "hot-take" ? "Offer a slightly controversial but defensible opinion." : ""}
${engagement_type === "useful-tip" ? "Share a practical tip that others might want to save or share." : ""}
Keep under 200 characters for maximum impact.
Include 1-2 relevant hashtags.`
      }
    }]
  })
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);

console.log("Twitter MCP server running...");