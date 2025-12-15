# Keytex ERP Frontend

A modern, professional ERP frontend built with React, TypeScript, and Tailwind CSS. This application provides a comprehensive master data management system with a clean, responsive interface.

## 🚀 Features

- **Modern Tech Stack**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Authentication**: Simple admin login with token-based auth
- **Master Data Management**: 11 core masters with dynamic CRUD operations
- **Responsive Design**: Mobile-first, tablet-friendly, desktop-optimized
- **Accessibility**: Keyboard navigation, ARIA attributes, focus management
- **Mock API**: MSW (Mock Service Worker) for development
- **Form Validation**: React Hook Form + Zod validation
- **State Management**: React Query for server state, React hooks for local state

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Mocking**: MSW (Mock Service Worker)
- **Icons**: Lucide React

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── MasterDataTable.tsx
│   ├── MasterForm.tsx
│   └── SlideOver.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx
│   └── useMasters.ts
├── layouts/            # Layout components
│   └── MainLayout.tsx
├── lib/                # Utilities and configurations
│   ├── api.ts
│   ├── schemas.ts
│   └── utils.ts
├── mock/               # MSW mock API
│   ├── browser.ts
│   └── handlers.ts
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── MasterPage.tsx
├── App.tsx
├── main.tsx
└── index.css
```

## 🎯 Master Data Types

The application supports 11 core master data types:

1. **Company** - Company information and settings
2. **Branch** - Branch/site management
3. **Department** - Department organization
4. **User & Role** - User management and roles
5. **Role** - Role definitions and permissions
6. **Employee** - Employee records and information
7. **Machine** - Machine inventory and maintenance
8. **Tool & Fixture** - Tool management and calibration
9. **Shift** - Shift scheduling and management
10. **Currency** - Currency exchange rates
11. **Tax** - Tax configurations and rates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd keytex-erp-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Demo Credentials
- **Email**: admin@gmail.com
- **Password**: 12345678

## 🎨 Design System

### Colors
- **Primary**: #0B63FF (Blue)
- **Accent**: #00BFA6 (Teal)
- **Neutrals**: #0F1724 (Dark), #334155 (Medium)
- **Status**: Success, Warning, Error variants

### Typography
- **Font**: System font stack
- **Sizes**: Responsive typography scale
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Components
- **Cards**: Rounded corners (2xl), subtle shadows
- **Buttons**: Rounded corners (2xl), medium weight
- **Forms**: Clean labels, help text, validation states
- **Tables**: Sticky headers, zebra rows, compact actions

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding New Master Types

1. **Define Schema** in `src/lib/schemas.ts`:
   ```typescript
   newMaster: [
     { key: "id", label: "ID", type: "string", ui: "auto", required: true },
     { key: "name", label: "Name", type: "string", ui: "text", required: true },
     // ... more fields
   ]
   ```

2. **Add to Labels**:
   ```typescript
   masterLabels: {
     // ... existing
     newMaster: "New Master"
   }
   ```

3. **Update Mock API** in `src/mock/handlers.ts`:
   ```typescript
   seedData.newMaster = []
   // Add handlers
   ...createHandlers('newMaster', seedData.newMaster, 'id')
   ```

### Customizing Forms

The form system automatically generates forms based on field schemas. Supported field types:

- `text` - Text input
- `email` - Email input with validation
- `password` - Password input
- `number` - Number input
- `textarea` - Multi-line text
- `select` - Dropdown selection
- `date` - Date picker
- `time` - Time picker
- `checkbox` - Boolean checkbox
- `image` - File upload with preview
- `multiselect` - Multiple selection
- `auto` - Auto-generated (hidden)

### API Integration

To replace the mock API with a real backend:

1. **Update API Base URL** in `src/lib/api.ts`:
   ```typescript
   const api = axios.create({
     baseURL: 'https://your-api.com/api', // Change this
     // ...
   })
   ```

2. **Remove MSW** from `src/main.tsx`:
   ```typescript
   // Remove MSW initialization
   ReactDOM.createRoot(document.getElementById('root')!).render(
     // ... your app
   )
   ```

3. **Update Authentication** in `src/hooks/useAuth.tsx`:
   ```typescript
   const login = async (email: string, password: string) => {
     const response = await api.post('/auth/login', { email, password })
     // Handle real authentication
   }
   ```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login with admin credentials
- [ ] Navigate to dashboard
- [ ] Access all masters from dropdown
- [ ] Create new records in each master
- [ ] Edit existing records
- [ ] Delete records with confirmation
- [ ] View record details
- [ ] Form validation works
- [ ] Responsive design on mobile/tablet
- [ ] Keyboard navigation works

### Testing Different Masters

1. **Company Master**: Test logo upload, address fields
2. **Branch Master**: Test company relation dropdown
3. **Employee Master**: Test date fields, department relations
4. **Machine Master**: Test status dropdowns, maintenance dates
5. **Tool Master**: Test multiselect for machine compatibility

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Environment Variables

Create a `.env` file for environment-specific configurations:

```env
VITE_API_BASE_URL=https://your-api.com/api
VITE_APP_NAME=Keytex ERP
```

### Docker Deployment

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete master data management system
- Authentication and routing
- Responsive design
- Mock API integration
- Form validation
- Accessibility features

---

**Built with ❤️ for Keytex ERP System**
