// src/components/forms/SubscriptionForm.tsx - Migrado a usar validadores y formatters especializados

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// ✅ NUEVA ARQUITECTURA - Importar tipos directamente
import type { CreateSubscriptionData } from '../../services/api/subscription-service';
import type { Subscription } from '../../types';

// ✅ Validadores especializados
import { 
  validateCreateSubscription,
  validateUpdateSubscription,
  validateServiceName,
  validateCost,
  validateRenewalDate,
  getFirstErrorByField,
  type ValidationResult 
} from '../../utils/validators/subscription-validator';

// ✅ Formatters especializados
import { getFormOptions } from '../../utils/formatters/subscription-formatter';

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
  
  // ✅ Usar validadores especializados para errores en tiempo real
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // ✅ Obtener opciones del formulario usando formatter especializado
  const formOptions = getFormOptions();

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

  // ✅ Validación en tiempo real usando validadores especializados
  const validateField = (name: string, value: string) => {
    let fieldValidation: ValidationResult;

    switch (name) {
      case 'service_name':
        fieldValidation = validateServiceName(value);
        break;
      case 'cost':
        fieldValidation = validateCost(value);
        break;
      case 'renewal_date':
        fieldValidation = validateRenewalDate(value);
        break;
      default:
        // Para otros campos, usar validación completa del formulario
        const tempData = { ...formData, [name]: value };
        fieldValidation = mode === 'create' 
          ? validateCreateSubscription(tempData)
          : validateUpdateSubscription(tempData);
        break;
    }

    // ✅ Obtener errores específicos del campo
    const fieldErrors = getFirstErrorByField(fieldValidation.errors);
    
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: fieldErrors[name] || ''
    }));

    return fieldValidation.isValid;
  };

  // ✅ Validación completa del formulario
  const validateForm = (): boolean => {
    const validation = mode === 'create'
      ? validateCreateSubscription(formData)
      : validateUpdateSubscription(formData);

    setValidationResult(validation);
    
    const fieldErrors = getFirstErrorByField(validation.errors);
    setErrors(fieldErrors);

    return validation.isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: CreateSubscriptionData) => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo al cambiar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Validar campo después de un pequeño delay
    setTimeout(() => validateField(name, value), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Validar formulario completo antes de enviar
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Si el error viene del servidor, mostrarlo
      if (error instanceof Error) {
        setErrors(prev => ({
          ...prev,
          submit: error.message
        }));
      }
    }
  };

  // Helper para obtener clases CSS del input basado en errores
  const getInputClassName = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-3 bg-white border rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200";
    
    if (errors[fieldName]) {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-200`;
    }
    
    return `${baseClasses} border-gray-200 focus:border-[#c9f31d] focus:ring-[#c9f31d]/20`;
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Error general del formulario */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-700 text-sm">{errors.submit}</span>
          </div>
        </motion.div>
      )}

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
          className={getInputClassName('service_name')}
          placeholder="Ej: Netflix, Spotify, GitHub Pro"
          disabled={isLoading}
        />
        {errors.service_name && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.service_name}
          </motion.p>
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
            className={getInputClassName('plan_type')}
            disabled={isLoading}
          >
            {formOptions.planTypes.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.plan_type && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600"
            >
              {errors.plan_type}
            </motion.p>
          )}
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
            className={getInputClassName('status')}
            disabled={isLoading}
          >
            {formOptions.statuses.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.status && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600"
            >
              {errors.status}
            </motion.p>
          )}
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
          className={getInputClassName('billing_cycle')}
          disabled={isLoading}
        >
          {formOptions.billingCycles.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.billing_cycle && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.billing_cycle}
          </motion.p>
        )}
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
              className={`${getInputClassName('cost')} pl-8`}
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>
          {errors.cost && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600"
            >
              {errors.cost}
            </motion.p>
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
            className={getInputClassName('renewal_date')}
            disabled={isLoading}
            min={new Date().toISOString().split('T')[0]} // Mínimo hoy
          />
          {errors.renewal_date && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600"
            >
              {errors.renewal_date}
            </motion.p>
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
          disabled={isLoading || Object.values(errors).some(error => error !== '')}
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

      {/* Información de ayuda mejorada */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Consejos de Validación</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Para servicios gratuitos, deja el costo en $0.00</li>
                <li>La fecha de renovación debe ser futura</li>
                <li>Si seleccionas "gratis", el costo se validará automáticamente</li>
                <li>Si seleccionas "pago", el costo debe ser mayor a $0.00</li>
                <li>El nombre del servicio debe tener al menos 2 caracteres</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info en desarrollo */}
      {import.meta.env.DEV && validationResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mt-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">🔧 Debug - Validación</h4>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify({ 
              isValid: validationResult.isValid, 
              errorCount: validationResult.errors.length,
              errors: validationResult.errors.map(e => ({ field: e.field, message: e.message }))
            }, null, 2)}
          </pre>
        </div>
      )}
    </motion.form>
  );
};