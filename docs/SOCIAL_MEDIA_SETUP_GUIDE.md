# Social Media Integration Setup Guide

This guide explains how to obtain API keys and set up social media integrations for Postiz analytics tracking.

## Table of Contents
1. [Facebook/Instagram](#facebook-instagram)
2. [Twitter/X](#twitter-x)
3. [LinkedIn](#linkedin)
4. [TikTok](#tiktok)
5. [YouTube](#youtube)
6. [General Setup Steps](#general-setup-steps)

---

## Facebook/Instagram

### Prerequisites
- Facebook Developer Account
- Facebook Page with Admin access
- Instagram Business Account (linked to Facebook Page)

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** as app type
4. Fill in app details:
   - **App Name**: Your app name
   - **App Contact Email**: Your email
   - **Business Account**: Select or create

### Step 2: Configure App
1. In App Dashboard, go to **Settings** → **Basic**
2. Note your **App ID** and **App Secret**
3. Add **App Domains**: `your-domain.com`
4. Click **Add Platform** → **Website**
5. Enter your **Site URL**: `https://your-domain.com`

### Step 3: Add Facebook Login
1. In left sidebar, click **Add Product**
2. Find **Facebook Login** and click **Set Up**
3. Select **Web** platform
4. Configure OAuth Redirect URIs:
   ```
   https://your-domain.com/integrations/social/facebook/callback
   ```

### Step 4: Add Required Permissions
1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - `pages_read_engagement` - Read page engagement data
   - `pages_show_list` - List pages
   - `instagram_basic` - Instagram basic access
   - `instagram_manage_insights` - Instagram insights
   - `read_insights` - Page insights

### Step 5: Get Access Token
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Click **Generate Access Token**
4. Grant all requested permissions
5. Copy the **User Access Token**

### Step 6: Get Long-Lived Token
```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
```

### Environment Variables
```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=https://your-domain.com/integrations/social/facebook/callback
```

---

## Twitter/X

### Step 1: Create Developer Account
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Click **Sign up** if you don't have a developer account
3. Complete the application form
4. Wait for approval (usually instant for basic access)

### Step 2: Create Project and App
1. In Developer Portal, click **Projects & Apps**
2. Click **Create Project**
3. Fill in project details:
   - **Project Name**: Your project name
   - **Use Case**: Choose appropriate category
   - **Project Description**: Brief description

### Step 3: Configure App Settings
1. Under your project, click **Create App**
2. Name your app
3. Note your **API Key** and **API Secret Key**
4. Click **App Settings**

### Step 4: Enable OAuth 2.0
1. In App Settings, go to **User authentication settings**
2. Click **Set up**
3. Configure:
   - **App permissions**: Read and write
   - **Type of App**: Web App
   - **Callback URI**: `https://your-domain.com/integrations/social/twitter/callback`
   - **Website URL**: `https://your-domain.com`

### Step 5: Get Bearer Token
1. In App Settings, go to **Keys and tokens**
2. Under **Bearer Token**, click **Generate**
3. Copy and save the token

### Environment Variables
```env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_REDIRECT_URI=https://your-domain.com/integrations/social/twitter/callback
```

---

## LinkedIn

### Step 1: Create LinkedIn App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **Create app**
3. Fill in app details:
   - **App name**: Your app name
   - **LinkedIn Page**: Select your company page
   - **Privacy policy URL**: Your privacy policy
   - **App logo**: Upload logo

### Step 2: Configure Products
1. In app dashboard, go to **Products**
2. Request access to:
   - **Sign In with LinkedIn**
   - **Share on LinkedIn**
   - **Marketing Developer Platform** (for analytics)

### Step 3: Get Client Credentials
1. Go to **Auth** tab
2. Note your **Client ID** and **Client Secret**
3. Add **Redirect URLs**:
   ```
   https://your-domain.com/integrations/social/linkedin/callback
   ```

### Step 4: Configure OAuth Scopes
Required scopes:
- `r_liteprofile` - Basic profile info
- `r_emailaddress` - Email address
- `w_member_social` - Share content
- `r_organization_social` - Read organization posts
- `rw_organization_admin` - Manage organization

### Environment Variables
```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=https://your-domain.com/integrations/social/linkedin/callback
```

---

## TikTok

### Step 1: Register Developer Account
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Click **Register** and create account
3. Complete business verification if needed

### Step 2: Create App
1. In Developer Portal, click **Manage apps**
2. Click **Connect an app**
3. Fill in app information:
   - **App name**: Your app name
   - **Company name**: Your company
   - **Category**: Choose appropriate category

### Step 3: Configure Login Kit
1. Add **Login Kit** product
2. Configure redirect URL:
   ```
   https://your-domain.com/integrations/social/tiktok/callback
   ```

### Step 4: Request API Access
1. Go to **API Products**
2. Request access to:
   - **Login Kit** - User authentication
   - **Display API** - View analytics
   - **Research API** - Advanced analytics (business only)

### Step 5: Get Credentials
1. Go to **Basic information**
2. Copy **Client Key** and **Client Secret**

### Environment Variables
```env
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=https://your-domain.com/integrations/social/tiktok/callback
```

---

## YouTube

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project**
3. Enter project name and click **Create**

### Step 2: Enable YouTube Data API
1. In Cloud Console, go to **APIs & Services** → **Library**
2. Search for **YouTube Data API v3**
3. Click the API and then **Enable**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure OAuth consent screen if prompted:
   - **User Type**: External
   - **App name**: Your app name
   - **User support email**: Your email
   - **Developer contact**: Your email
4. For Application type, select **Web application**
5. Add **Authorized redirect URIs**:
   ```
   https://your-domain.com/integrations/social/youtube/callback
   ```

### Step 4: Get Client Credentials
1. After creating, note your **Client ID** and **Client Secret**
2. Download the JSON file (optional, for backup)

### Step 5: Configure API Scopes
Required scopes:
- `https://www.googleapis.com/auth/youtube.readonly` - View YouTube account
- `https://www.googleapis.com/auth/yt-analytics.readonly` - View analytics
- `https://www.googleapis.com/auth/youtube.force-ssl` - Manage YouTube account

### Environment Variables
```env
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=https://your-domain.com/integrations/social/youtube/callback
GOOGLE_API_KEY=your_api_key
```

---

## General Setup Steps

### 1. Configure Environment Variables
Create or update your `.env` file in the project root:

```env
# Facebook/Instagram
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://your-domain.com/integrations/social/facebook/callback

# Twitter/X
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_REDIRECT_URI=https://your-domain.com/integrations/social/twitter/callback

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://your-domain.com/integrations/social/linkedin/callback

# TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://your-domain.com/integrations/social/tiktok/callback

# YouTube
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=https://your-domain.com/integrations/social/youtube/callback
GOOGLE_API_KEY=your_google_api_key

# Application
NEXT_PUBLIC_BACKEND_URL=http://localhost:4001
FRONTEND_URL=http://localhost:4200
```

### 2. Connect Accounts in Postiz

1. **Login to Postiz**
   - Navigate to `http://localhost:4200`
   - Create account or login

2. **Add Social Media Integration**
   - Go to **Settings** → **Integrations**
   - Click **Add Integration**
   - Select the social network
   - Click **Connect**
   - Authorize the app

3. **Configure Tracking**
   - After connection, go to **Analytics** → **Tracked Pages**
   - Select which pages/accounts to track
   - Click **Start Tracking**

### 3. Verify Setup

Test each integration:

```bash
# Test Facebook
curl http://localhost:4001/api/integrations/facebook/test

# Test Twitter
curl http://localhost:4001/api/integrations/twitter/test

# Test LinkedIn
curl http://localhost:4001/api/integrations/linkedin/test

# Test TikTok
curl http://localhost:4001/api/integrations/tiktok/test

# Test YouTube
curl http://localhost:4001/api/integrations/youtube/test
```

---

## Troubleshooting

### Common Issues

**1. OAuth Redirect URI Mismatch**
- Ensure redirect URIs in platform settings match exactly
- Include protocol (https://)
- No trailing slashes

**2. Invalid Access Token**
- Tokens may expire - implement refresh logic
- Check token scopes/permissions
- Regenerate if necessary

**3. API Rate Limits**
- Facebook: 200 calls/hour
- Twitter: 300 requests/15 min
- LinkedIn: Varies by endpoint
- TikTok: 100 requests/day (standard)
- YouTube: 10,000 units/day

**4. Missing Permissions**
- Review required scopes for each platform
- Re-authorize if permissions changed
- Check app review status

### Support Resources

- **Facebook**: [Facebook for Developers](https://developers.facebook.com/support/)
- **Twitter**: [Twitter API Documentation](https://developer.twitter.com/en/docs)
- **LinkedIn**: [LinkedIn Developer Support](https://www.linkedin.com/help/linkedin/answer/a548360)
- **TikTok**: [TikTok for Developers](https://developers.tiktok.com/doc)
- **YouTube**: [YouTube API Support](https://developers.google.com/youtube/v3/support)

---

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables for all secrets**
3. **Implement token refresh logic**
4. **Use HTTPS in production**
5. **Regularly rotate API keys**
6. **Monitor API usage and quotas**
7. **Implement proper error handling**
8. **Log authentication attempts**

---

## Next Steps

After setup:
1. ✅ Connect all desired social media accounts
2. ✅ Configure analytics tracking for your pages
3. ✅ Set up automated data ingestion
4. ✅ Create analytics dashboards
5. ✅ Configure alerts and notifications

For more information, see:
- [Analytics Setup Guide](./ANALYTICS_SETUP.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
