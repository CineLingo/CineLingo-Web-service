# Cinelingo Custom TTS Web

Custom Text-to-Speech (TTS) web application built with Next.js, Supabase, and modern web technologies.

## Features

- **Custom TTS Generation**: Upload reference audio and generate custom TTS with your own voice
- **User Authentication**: Secure user authentication with Supabase Auth
- **File Management**: Upload and manage audio files with Supabase Storage
- **Real-time Processing**: Track TTS processing status in real-time
- **Download Generated Audio**: Download generated TTS audio files
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **UI Components**: shadcn/ui, Lucide React icons
- **Styling**: Tailwind CSS with dark mode support

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd cinelingo-custom-tts-web
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Create a storage bucket named `prototype`
   - Set up the following database table:
     ```sql
     CREATE TABLE tts_requests (
       tts_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       user_id UUID REFERENCES auth.users(id),
       reference_audio_storage_path TEXT,
       reference_audio_url TEXT,
       gen_text TEXT,
       status TEXT DEFAULT 'pending',
       generated_audio_url TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign Up/Login**: Create an account or sign in to access the TTS features
2. **Upload Reference Audio**: Upload a high-quality audio file of your voice
3. **Enter Text**: Type the text you want to convert to speech
4. **Generate TTS**: Submit your request and wait for processing
5. **Download Result**: Once processing is complete, download your generated audio

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── upload/            # File upload page
│   └── tts-result/        # TTS results page
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries and configurations
└── utils/                 # Helper functions
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

This project can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
