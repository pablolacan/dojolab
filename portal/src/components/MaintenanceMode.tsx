import { motion } from "framer-motion";
import { config } from "../utils/config";
import type { MaintenanceModeData } from "../types";

interface MaintenanceModeProps {
  data: MaintenanceModeData;
  userIP?: string;
  isAllowedIP?: boolean;
}

export const MaintenanceMode = ({ data, userIP, isAllowedIP }: MaintenanceModeProps) => {
  const {
    title,
    message,
    estimated_time,
    contact_email,
    show_contact_email
  } = data;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto h-screen flex items-center px-6">
        
        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:items-center lg:justify-between w-full">
          
          {/* Left Side - Logo + Title */}
          <motion.div
            className="flex-1 max-w-2xl"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo con texto */}
            <motion.div
              className="flex items-center space-x-4 mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="w-12 h-12 bg-[#c9f31d] rounded-2xl flex items-center justify-center shadow-card">
                <span className="text-gray-900 font-bold text-lg text-heading">D</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-heading">
                THE DOJO LAB
              </span>
            </motion.div>

            {/* Título principal */}
            <motion.h1
              className="text-5xl xl:text-6xl font-black uppercase leading-tight tracking-tight text-heading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {title}
            </motion.h1>
          </motion.div>

          {/* Right Side - Info */}
          <motion.div
            className="flex-1 max-w-xl pl-16"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-card">
              <div className="space-y-8">
                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <p className="text-lg text-gray-700 leading-relaxed text-body">
                    {message}
                  </p>
                </motion.div>

                {/* Status */}
                <motion.div
                  className="border-l-4 border-[#c9f31d] pl-6 py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2 text-caption">
                    Estado
                  </p>
                  <p className="text-xl font-bold text-gray-900 text-subheading">
                    {estimated_time}
                  </p>
                </motion.div>

                {/* Contact */}
                {show_contact_email && contact_email && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2 text-caption">
                      Contacto de emergencia
                    </p>
                    <a
                      href={`mailto:${contact_email}`}
                      className="inline-flex items-center text-lg text-gray-900 hover:text-gray-700 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-body font-medium"
                    >
                      {contact_email}
                    </a>
                  </motion.div>
                )}

                {/* Debug Info - Solo en desarrollo */}
                {config.isDevelopment && (userIP || isAllowedIP !== undefined) && (
                  <motion.div
                    className="border-t border-gray-100 pt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                  >
                    <p className="text-xs uppercase tracking-wider text-red-500 font-medium mb-3 text-caption">
                      🔧 Debug Info (Solo Desarrollo)
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
                      {userIP && (
                        <p className="text-sm text-red-700 text-body">
                          <span className="font-medium">Tu IP:</span> {userIP}
                        </p>
                      )}
                      {isAllowedIP !== undefined && (
                        <p className="text-sm text-red-700 text-body">
                          <span className="font-medium">¿IP Permitida?:</span> {isAllowedIP ? '✅ Sí' : '❌ No'}
                        </p>
                      )}
                      <p className="text-xs text-red-600 text-body">
                        Este mensaje solo aparece en desarrollo
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden w-full">
          <div className="text-center space-y-8 max-w-md mx-auto">
            
            {/* Logo + Brand */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="w-16 h-16 bg-[#c9f31d] rounded-2xl flex items-center justify-center shadow-card mx-auto">
                <span className="text-gray-900 font-bold text-xl text-heading">D</span>
              </div>
              <p className="text-sm font-medium tracking-wider text-gray-600 text-caption">
                THE DOJO LAB
              </p>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-3xl md:text-4xl font-black uppercase leading-tight tracking-tight text-heading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {title}
            </motion.h1>

            {/* Content */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <p className="text-base text-gray-700 leading-relaxed text-body">
                {message}
              </p>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-card">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1 text-caption">
                    Estado
                  </p>
                  <p className="text-lg font-bold text-gray-900 text-subheading">
                    {estimated_time}
                  </p>
                </div>

                {show_contact_email && contact_email && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1 text-caption">
                      Contacto
                    </p>
                    <a
                      href={`mailto:${contact_email}`}
                      className="inline-flex items-center text-sm text-gray-900 hover:text-gray-700 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full text-body font-medium"
                    >
                      {contact_email}
                    </a>
                  </div>
                )}

                {/* Debug Info Mobile - Solo en desarrollo */}
                {config.isDevelopment && (userIP || isAllowedIP !== undefined) && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs uppercase tracking-wider text-red-500 font-medium mb-2 text-caption">
                      🔧 Debug Info
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3 space-y-1">
                      {userIP && (
                        <p className="text-xs text-red-700 text-body">
                          <span className="font-medium">IP:</span> {userIP}
                        </p>
                      )}
                      {isAllowedIP !== undefined && (
                        <p className="text-xs text-red-700 text-body">
                          <span className="font-medium">Permitida:</span> {isAllowedIP ? '✅' : '❌'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

      </div>

      {/* Status Indicator */}
      <motion.div
        className="fixed bottom-6 left-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-card">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs uppercase tracking-wider font-medium text-gray-600 text-caption">Maintenance Mode</span>
        </div>
      </motion.div>

      {/* Auto-refresh notice */}
      <motion.div
        className="fixed bottom-6 right-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <div className="bg-white border border-gray-200 rounded-full px-4 py-2 shadow-card">
          <p className="text-xs text-gray-500 uppercase tracking-wider text-caption">
            Verificando cada 5 min
          </p>
        </div>
      </motion.div>
    </main>
  );
};