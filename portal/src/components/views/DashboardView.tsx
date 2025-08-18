import { motion } from "framer-motion";
import { useMaintenance } from "../../hooks/useMaintenance";
import { config } from "../../utils/config";
import { StatCard } from "../ui/StatCard";
import { InfoPanel } from "../ui/InfoPanel";

interface DashboardViewProps {
  user: any;
}

export const DashboardView = ({ user }: DashboardViewProps) => {
  const { maintenanceData, isActive } = useMaintenance();

  const stats = [
    {
      title: "Estado de la API",
      value: "Conectada",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "green" as const,
      description: "Conexión estable con Directus"
    },
    {
      title: "Modo Mantenimiento",
      value: isActive ? "Activo" : "Inactivo",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: isActive ? "red" as const : "green" as const,
      description: maintenanceData?.message || "Sistema funcionando normalmente"
    },
    {
      title: "Versión del Dashboard",
      value: config.appVersion,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2a1 1 0 011 1v3m8-3v3m-8 1h8" />
        </svg>
      ),
      color: "blue" as const,
      description: "Última versión del panel administrativo"
    },
    {
      title: "Sesión de Usuario",
      value: "Activa",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "green" as const,
      description: `Conectado como ${user?.email}`
    }
  ];

  const userInfo = [
    { label: "Nombre", value: `${user?.first_name} ${user?.last_name}` },
    { label: "Email", value: user?.email },
    { label: "Rol", value: user?.role?.name },
    { label: "Estado", value: "Activo", isStatus: true }
  ];

  const systemInfo = [
    { label: "API URL", value: config.directusUrl },
    { label: "Ambiente", value: config.isDevelopment ? 'Desarrollo' : 'Producción' },
    { 
      label: "Mantenimiento", 
      value: isActive ? 'Activo' : 'Inactivo', 
      isStatus: true, 
      statusColor: isActive ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100' 
    },
    { label: "Última verificación", value: "Hace unos momentos" }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-card border border-gray-100"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-heading">
          Bienvenido, {user?.first_name}
        </h1>
        <p className="text-gray-600 text-body">
          Panel de administración de The Dojo Lab
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            description={stat.description}
            delay={0.1 + index * 0.1}
          />
        ))}
      </div>

      {/* Content Grid */}

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoPanel
          title="Información de Usuario"
          items={userInfo}
          delay={0.4}
        />

        <InfoPanel
          title="Información del Sistema"
          items={systemInfo}
          delay={0.5}
        />
      </div>
    </div>
  );
};