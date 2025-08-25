import React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useLoginForm } from '../../hooks/use-auth-forms';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    onSubmit,
    isLoading,
    error,
    clearError,
    formState: { errors }
  } = useLoginForm();

  const handleFormSubmit = async (data: any) => {
    const success = await onSubmit(data);
    if (success) {
      console.log('Login successful, redirecting...');
    }
  };

  const handleInputFocus = () => {
    if (error) {
      clearError();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Izquierdo - Formulario Dark (más pequeño) */}
      <div className="w-full lg:w-2/5 bg-zinc-950 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-16 w-auto"
            />
          </motion.div>

          {/* Login Card */}
          <Card className="border-zinc-800 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Bienvenido
              </CardTitle>
              <p className="text-zinc-400">
                Inicia sesión para continuar
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Global Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-red-950/50 border border-red-800"
                  >
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}

                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Input
                    {...register('email')}
                    type="email"
                    label="Correo Electrónico"
                    placeholder="tu@email.com"
                    error={errors.email?.message}
                    leftIcon={<Mail className="h-4 w-4" />}
                    onFocus={handleInputFocus}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label="Contraseña"
                    placeholder="Tu contraseña"
                    error={errors.password?.message}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    onRightIconClick={() => setShowPassword(!showPassword)}
                    onFocus={handleInputFocus}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </motion.div>

                {/* Login Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    Iniciar Sesión
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lado Derecho - Imagen (más grande) */}
      <div className="hidden lg:block w-3/5 relative overflow-hidden">
        <img 
          src="/login-bg.webp" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        {/* Overlay sutil para mejorar la transición visual */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/20 to-transparent" />
      </div>
    </div>
  );
};

export default Login;