# Cinelingo Web Service

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
   - Set up the following database tables:
     ```sql
     CREATE TABLE public.accounts (
       account_id uuid NOT NULL DEFAULT gen_random_uuid(),
       name character varying,
       email character varying NOT NULL UNIQUE,
       usage real DEFAULT 0.0,
       created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT accounts_pkey PRIMARY KEY (account_id)
     );

     CREATE TABLE public.users (
       user_id uuid NOT NULL DEFAULT gen_random_uuid(),
       display_name character varying,
       email character varying NOT NULL UNIQUE,
       avatar_url text,
       created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
       auth_provider boolean DEFAULT false,
       balance double precision DEFAULT '0'::double precision,
       CONSTRAINT users_pkey PRIMARY KEY (user_id)
     );

     CREATE TABLE public.user_to_account_mapping (
       user_id uuid NOT NULL,
       account_id uuid NOT NULL,
       created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT user_to_account_mapping_pkey PRIMARY KEY (user_id, account_id),
       CONSTRAINT user_to_account_mapping_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(account_id),
       CONSTRAINT user_to_account_mapping_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
     );

     CREATE TABLE public.ref_audios (
       ref_id uuid NOT NULL DEFAULT gen_random_uuid(),
       user_id uuid,
       ref_file_url text NOT NULL,
       language USER-DEFINED,
       ref_preset USER-DEFINED,
       ref_text text,
       ref_duration real,
       is_public boolean DEFAULT false,
       ref_shared_title text CHECK (length(ref_shared_title) <= 50),
       created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
       ref_file_path text NOT NULL,
       ref_shared_image text,
       CONSTRAINT ref_audios_pkey PRIMARY KEY (ref_id),
       CONSTRAINT ref_audios_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
     );

     CREATE TABLE public.tts_requests (
       request_id uuid NOT NULL DEFAULT gen_random_uuid(),
       user_id uuid,
       reference_id uuid,
       input_text text NOT NULL,
       created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
       waited_time real,
       status USER-DEFINED,
       updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT tts_requests_pkey PRIMARY KEY (request_id),
       CONSTRAINT tts_requests_reference_id_fkey FOREIGN KEY (reference_id) REFERENCES public.ref_audios(ref_id),
       CONSTRAINT tts_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
     );

     CREATE TABLE public.gen_audios (
       gen_id uuid NOT NULL DEFAULT gen_random_uuid(),
       request_id uuid,
       gen_file_url text,
       model_version character varying NOT NULL,
       gen_is_public boolean DEFAULT false,
       gen_text text,
       gen_duration real,
       created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
       gen_file_path text NOT NULL,
       gen_shared_title text CHECK (length(gen_shared_title) <= 50),
       gen_shared_image text,
       CONSTRAINT gen_audios_pkey PRIMARY KEY (gen_id),
       CONSTRAINT gen_audios_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.tts_requests(request_id)
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
