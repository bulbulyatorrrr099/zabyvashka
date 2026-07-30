import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/zabyvashka/', // Обязательно указываем имя репозитория со слэшами
  plugins: [react()],
})
