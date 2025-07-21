# RTSP Stream Viewer Pro

A professional-grade RTSP stream management platform built with Next.js, React, and Python. This application provides enterprise-level monitoring and management capabilities for RTSP video streams.

## 🚀 Features

### Core Functionality
- **Stream Management** - Add, edit, delete, and organize RTSP streams
- **Real-time Monitoring** - Live stream status, analytics, and performance metrics
- **Professional Dashboard** - Clean, modern interface with comprehensive analytics
- **Stream Validation** - Automatic RTSP URL validation and quality assessment
- **Favorites System** - Mark and organize important streams
- **Category Organization** - Organize streams by Security, Meeting, Industrial, etc.

### Technical Features
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Real-time Updates** - Live stream statistics and status monitoring
- **Professional UI** - Built with shadcn/ui components and Tailwind CSS
- **API Integration** - RESTful API with proper error handling
- **Demo Mode** - Fallback functionality when API is unavailable
- **TypeScript** - Full type safety throughout the application

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - Modern React with hooks and server components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Lucide React** - Beautiful icons

### Backend
- **Python** - Serverless functions for API endpoints
- **Vercel Functions** - Serverless deployment platform
- **RESTful API** - Standard HTTP methods and responses
- **CORS Support** - Cross-origin resource sharing enabled

## 📁 Project Structure

\`\`\`
rtspstream/
├── app/
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── stream-viewer-pro.tsx # Main application component
│   └── theme-provider.tsx  # Theme configuration
├── api/
│   ├── index.py           # Main API endpoint
│   ├── streams.py         # Stream management API
│   └── health.py          # Health check endpoint
├── lib/
│   └── utils.ts           # Utility functions
├── hooks/
│   ├── use-mobile.tsx     # Mobile detection hook
│   └── use-toast.ts       # Toast notification hook
└── README.md              # This file
\`\`\`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/rtspstream.git
   cd rtspstream
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy with default settings

3. **API Endpoints**
   After deployment, your API will be available at:
   - \`/api/health\` - Health check
   - \`/api/streams\` - Stream management
   - \`/api/streams/validate_stream\` - URL validation
   - \`/api/streams/stream_data\` - Stream analytics

## 📊 API Documentation

### Endpoints

#### GET /api/health
Returns API health status and system information.

**Response:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-21T15:30:00Z",
  "version": "1.0.0",
  "uptime": "99.9%",
  "services": {
    "api": "operational",
    "database": "operational",
    "streaming": "operational"
  }
}
\`\`\`

#### GET /api/streams
Returns list of all RTSP streams with metadata.

**Response:**
\`\`\`json
{
  "streams": [...],
  "total": 4,
  "active": 3,
  "categories": ["Security", "Meeting", "Industrial"]
}
\`\`\`

#### POST /api/streams
Add a new RTSP stream.

**Request Body:**
\`\`\`json
{
  "name": "New Camera",
  "url": "rtsp://example.com:554/stream",
  "category": "Security",
  "location": "Building A"
}
\`\`\`

#### GET /api/streams/validate_stream?url=rtsp://...
Validate an RTSP URL format and accessibility.

#### GET /api/streams/stream_data?id=1
Get real-time analytics for a specific stream.

## 🎯 Use Cases

### Enterprise Security
- Monitor multiple security cameras
- Track uptime and performance
- Organize by location and priority
- Real-time alerts and notifications

### Conference Management
- Manage meeting room cameras
- Monitor stream quality during meetings
- Quick access to frequently used rooms
- Performance analytics

### Industrial Monitoring
- Production floor surveillance
- Equipment monitoring cameras
- Quality control streams
- Safety compliance monitoring

## 🔧 Configuration

### Environment Variables
Create a \`.env.local\` file for local development:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
\`\`\`

### Customization
- **Themes**: Modify \`tailwind.config.js\` for custom colors
- **Components**: Extend shadcn/ui components in \`components/ui/\`
- **API**: Add new endpoints in the \`api/\` directory

## 🧪 Testing

### Manual Testing
1. **Add Stream** - Test adding new RTSP streams
2. **Stream Management** - Test editing, deleting, favoriting
3. **Analytics** - Verify real-time data updates
4. **Responsive Design** - Test on different screen sizes
5. **API Endpoints** - Test all API endpoints directly

### Demo Mode
The application includes a demo mode with realistic data when the API is unavailable, ensuring the interface can be tested even without a backend.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@rtspstream.com
- Documentation: [docs.rtspstream.com](https://docs.rtspstream.com)

## 🏆 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Deployed on [Vercel](https://vercel.com/)

---

**Professional RTSP Stream Management Platform** - Ready for enterprise deployment and job submissions.
\`\`\`
