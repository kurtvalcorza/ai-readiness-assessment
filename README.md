# AI Readiness Assessment

A self-service chatbot for assessing AI readiness of Philippine government agencies and NGOs.

## Features

- **Interactive Assessment**: 12-question guided interview
- **AI-Powered**: Uses Google's Gemini 2.5 Flash for intelligent conversations
- **Automatic Report Generation**: Creates customized assessment reports
- **Data Collection**: Automatically saves responses to Google Sheets
- **Download Reports**: Users can download their assessment as Markdown
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 16.1.4, React 19.2, Tailwind CSS
- **AI**: Google Generative AI (Gemini 2.5 Flash)
- **UI Components**: Lucide React icons, ReactMarkdown
- **Deployment**: Vercel
- **Data Storage**: Google Sheets via Apps Script

## Quick Start

### Development

1. Clone or download this repository

2. **Important**: Move to a local drive (e.g., `C:\Projects\`)
   - Running from Google Drive is slow due to file locking

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create `.env.local` file:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   GOOGLE_SHEETS_WEBHOOK_URL=your_webhook_url_here
   ```

5. Run development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

### Google Sheets Setup (Optional - for collecting responses)

1. Create a Google Sheet with these headers:
   - A1: Timestamp, B1: Organization, C1: Domain, D1: Readiness Level
   - E1: Primary Solution, F1: Secondary Solution, G1: Next Steps, H1: Conversation History

2. Go to **Extensions** → **Apps Script** and paste this code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp, data.organization, data.domain, data.readinessLevel,
      data.primarySolution, data.secondarySolution, data.nextSteps, data.conversationHistory
    ]);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Deploy as **Web app** (Execute as: Me, Access: Anyone)
4. Copy the Web App URL and add to `.env.local` as `GOOGLE_SHEETS_WEBHOOK_URL`

### Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions or [QUICKSTART-DEPLOYMENT.md](./QUICKSTART-DEPLOYMENT.md) for a 10-minute quick start guide.

## Project Structure

```
ai-readiness-assessment/
├── app/
│   ├── api/
│   │   ├── chat/          # Chat API endpoint with AI streaming
│   │   └── submit/        # Submission API for Google Sheets
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main chat interface
│   └── globals.css        # Global styles
├── lib/
│   └── systemPrompt.ts    # AI system prompt & assessment logic
├── public/                # Static assets
├── .env.example           # Environment variables template
├── DEPLOYMENT.md          # Deployment guide
└── package.json           # Dependencies
```

## How It Works

1. **User visits the app** - Greeted by the AI assistant
2. **Interactive interview** - 12 questions across 6 sections:
   - Agency Context
   - Domain Classification
   - Pain Points
   - Data & Systems
   - Readiness Signals
   - Interest & Constraints
3. **AI generates report** - Customized assessment with readiness level and recommendations
4. **Data saved** - Response automatically sent to Google Sheets
5. **Download available** - User can download Markdown report

## Assessment Output

The tool provides:
- **Readiness Classification**: High/Medium/Low
- **AI Solution Recommendations**: Prioritized list of suitable AI solutions
- **Next Steps**: Actionable recommendations for AI adoption

## Environment Variables

Required:
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key
- `GOOGLE_SHEETS_WEBHOOK_URL` - Google Apps Script webhook URL (optional, for data collection)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Files

- `app/page.tsx` - Main chat interface component with TextStreamChatTransport
- `app/api/chat/route.ts` - Chat API handler with AI streaming
- `app/api/submit/route.ts` - Submission handler for Google Sheets integration
- `lib/systemPrompt.ts` - AI system prompt with questionnaire logic and rules

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License

## Support

For questions or issues, please open an issue on the repository.
