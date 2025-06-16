# EDUVIBE-X Learning Platform

EDUVIBE-X is a modern educational platform designed to provide seamless learning experiences for students, teachers, and parents. The platform offers features like live classes, test series, doubt solving, and comprehensive course management.

## Features

- **User Authentication**
  - Phone/Email OTP verification
  - Aadhar verification for identity
  - Role-based access (Student/Teacher/Parent)

- **Learning Management**
  - Live classes with real-time interaction
  - Recorded video lectures
  - Interactive course materials
  - Progress tracking
  - Test series and assessments

- **Student Features**
  - Course enrollment
  - Test participation
  - Doubt resolution
  - Progress analytics
  - Study materials access

- **Teacher Features**
  - Course creation and management
  - Live class scheduling
  - Test creation and evaluation
  - Student performance monitoring
  - Doubt resolution

- **Parent Features**
  - Student progress tracking
  - Performance analytics
  - Payment management
  - Communication with teachers

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Tailwind CSS for styling
- Google Fonts & Font Awesome icons
- Real-time updates with WebSocket

### Backend
- Node.js & Express.js
- MongoDB for database
- Redis for caching
- JWT for authentication
- WebSocket for real-time features

### Infrastructure
- Docker & Docker Compose
- Nginx as reverse proxy
- PM2 for process management
- AWS for cloud hosting

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Docker & Docker Compose
- MongoDB
- Redis

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/eduvibe-x.git
cd eduvibe-x
```

2. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configurations
```

3. Start the application using Docker:
```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api-docs

### Development

1. Start the development servers:
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

2. Access the development environment:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## API Documentation

The API documentation is available at `/api-docs` when running the server. It includes:
- Authentication endpoints
- User management
- Course management
- Test series
- Doubt resolution
- Payment integration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Project Structure

```
eduvibe-x/
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   ├── js/
│   │   └── index.html
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   └── Dockerfile
├── nginx/
│   └── conf.d/
│       └── default.conf
├── docker-compose.yml
└── README.md
```

## Security

- OTP-based authentication
- JWT token management
- Rate limiting
- Input validation
- XSS protection
- CORS configuration
- Aadhar verification

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@eduvibex.com or join our Slack channel.

## Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/)
- [Font Awesome](https://fontawesome.com/)
- [Google Fonts](https://fonts.google.com/)
- All contributors who have helped this project grow

---

Made with ❤️ by the EDUVIBE-X Team
