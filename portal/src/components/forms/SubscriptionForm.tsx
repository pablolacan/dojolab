// src/components/forms/SubscriptionForm.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { subscriptionService } from '../../services/subscriptionService';
import type { CreateSubscriptionData } from '../../services/subscriptionService';
import type { Subscription } from '../../types';

interface SubscriptionFormProps {
  subscription?: Subscription;
  onSubmit: (data: CreateSubscriptionData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export const SubscriptionForm = ({
  subscription,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: SubscriptionFormProps) => {
  const [formData, setFormData] = useState<CreateSubscriptionData>({
    service_name: '',
    plan_type: 'free',
    billing_cycle: 'monthly',
    cost: '0.00',
    renewal_date: '',
    status: 'pending'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formOptions = subscriptionService.getFormOptions();

  // Cargar datos existentes en modo edición
  useEffect(() => {
    if (mode === 'edit' && subscription) {
      setFormData({
        service_name: subscription.service_name,
        plan_type: subscription.plan_type,
        billing_cycle: subscription.billing_cycle,
        cost: subscription.cost,
        renewal_date: subscription.renewal_date.split('T')[0], // Solo fecha
        status: subscription.status
      });
    }
  }, [subscription, mode]);

  // Validación en tiempo real
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'service_name':
        if (!value.trim()) {
          newErrors.service_name = 'El nombre del servicio es requerido';
        } else if (value.trim().length < 2) {
          newErrors.service_name = 'Mínimo 2 caracteres';
        } else {
          delete newErrors.service_name;
        }
        break;

      case 'cost':
        const cost = parseFloat(value);
        if (isNaN(cost) || cost < 0) {
          newErrors.cost = 'Debe ser un número válido mayor o igual a 0';
        } else {
          delete newErrors.cost;
        }
        break;

      case 'renewal_date':
        if (!value) {
          newErrors.renewal_date = 'La fecha de renovación es requerida';
        } else {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            newErrors.renewal_date = 'Fecha inválida';
          } else {
            delete newErrors.renewal_date;
          }
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreateSubscriptionData) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos
    const allValid = Object.keys(formData).every(key => 
      validateField(key, formData[key as keyof CreateSubscriptionData] as string)
    );

    if (!allValid) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Nombre del Servicio */}
      <div>
        <label htmlFor="service_name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Servicio *
        </label>
        <input
          type="text"
          id="service_name"
          name="service_name"
          value={formData.service_name}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 bg-white border rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200 ${
            errors.service_name 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-200 focus:border-[#c9f31d] focus:ring-[#c9f31d]/20'
          }`}
          placeholder="Ej: Netflix, Spotify, GitHub Pro"
          disabled={isLoading}
        />
        {errors.service_name && (
          <p className="mt-1 text-sm text-red-600">{errors.service_name}</p>
        )}
      </div>

      {/* Tipo de Plan y Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="plan_type" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Plan *
          </label>
          <select
            id="plan_type"
            name="plan_type"
            value={formData.plan_type}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#c9f31d] transition-all duration-200"
            disabled={isLoading}
          >
            {formOptions.planTypes.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Estado *
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#c9f31d] transition-all duration-200"
            disabled={isLoading}
          >
            {formOptions.statuses.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ciclo de Facturación */}
      <div>
        <label htmlFor="billing_cycle" className="block text-sm font-medium text-gray-700 mb-2">
          Ciclo de Facturación *
        </label>
        <select
          id="billing_cycle"
          name="billing_cycle"
          value={formData.billing_cycle}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:border-[#c9f31d] transition-all duration-200"
          disabled={isLoading}
        >
          {formOptions.billingCycles.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Costo y Fecha de Renovación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
            Costo *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              id="cost"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full pl-8 pr-4 py-3 bg-white border rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200 ${
                errors.cost 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-200 focus:border-[#c9f31d] focus:ring-[#c9f31d]/20'
              }`}
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>
          {errors.cost && (
            <p className="mt-1 text-sm text-red-600">{errors.cost}</p>
          )}
        </div>

        <div>
          <label htmlFor="renewal_date" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Renovación *
          </label>
          <input
            type="date"
            id="renewal_date"
            name="renewal_date"
            value={formData.renewal_date}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 bg-white border rounded-2xl text-gray-900 focus:outline-none transition-all duration-200 ${
              errors.renewal_date 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                : 'border-gray-200 focus:border-[#c9f31d] focus:ring-[#c9f31d]/20'
            }`}
            disabled={isLoading}
          />
          {errors.renewal_date && (
            <p className="mt-1 text-sm text-red-600">{errors.renewal_date}</p>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 font-medium disabled:opacity-50"
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={isLoading || Object.keys(errors).length > 0}
          className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c9f31d] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-card hover:shadow-card-hover font-medium"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>{mode === 'create' ? 'Creando...' : 'Guardando...'}</span>
            </div>
          ) : (
            mode === 'create' ? 'Crear Suscripción' : 'Guardar Cambios'
          )}
        </button>
      </div>

      {/* Información de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Consejos</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Para servicios gratuitos, deja el costo en $0.00</li>
                <li>La fecha de renovación se usa para recordatorios</li>
                <li>Puedes cambiar el estado después de crear la suscripción</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.form>
  );
};