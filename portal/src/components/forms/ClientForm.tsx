// src/components/forms/ClientForm.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Client, CreateClientData, ClientWebsite } from '../../types/client';
import { Input } from '../ui/Input';
import { 
  validateCreateClient, 
  validateUpdateClient, 
  getFirstErrorByField} from '../../utils/validators/client-validator';
import { getClientFormOptions } from '../../utils/formatters/client-formatter';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export const ClientForm = ({
  client,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: ClientFormProps) => {
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    email: '',
    phone: '',
    status: 'prospect',
    notes: '',
    websites: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Obtener opciones del formulario
  const formOptions = getClientFormOptions();

  // Cargar datos existentes en modo edición
  useEffect(() => {
    if (mode === 'edit' && client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        status: client.status,
        notes: client.notes || '',
        websites: client.websites || []
      });
    }
  }, [client, mode]);

  // Validación en tiempo real
  const validateField = (name: string, value: string | ClientWebsite[]) => {
    const tempData = { ...formData, [name]: value };
    
    const validation = mode === 'create' 
      ? validateCreateClient(tempData)
      : validateUpdateClient(tempData);
    
    const fieldErrors = getFirstErrorByField(validation.errors);
    
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: fieldErrors[name] || ''
    }));

    return !fieldErrors[name];
  };

  // Validación completa del formulario
  const validateForm = (): boolean => {
    setIsValidating(true);
    
    const validation = mode === 'create'
      ? validateCreateClient(formData)
      : validateUpdateClient(formData);

    const fieldErrors = getFirstErrorByField(validation.errors);
    setErrors(fieldErrors);
    
    setIsValidating(false);
    return validation.isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: CreateClientData) => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo al cambiar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Validar campo después de un pequeño delay
    setTimeout(() => validateField(name, value), 300);
  };

  // Manejo de websites
  const addWebsite = () => {
    const newWebsite: ClientWebsite = {
      url: '',
      description: '',
      is_primary: (formData.websites || []).length === 0
    };
    
    const updatedWebsites = [...(formData.websites || []), newWebsite];
    setFormData(prev => ({ ...prev, websites: updatedWebsites }));
  };

  const updateWebsite = (index: number, field: keyof ClientWebsite, value: string | boolean) => {
    const updatedWebsites = [...(formData.websites || [])];
    updatedWebsites[index] = { ...updatedWebsites[index], [field]: value };
    
    // Si se marca como primario, desmarcar otros
    if (field === 'is_primary' && value === true) {
      updatedWebsites.forEach((website, i) => {
        if (i !== index) {
          website.is_primary = false;
        }
      });
    }
    
    setFormData(prev => ({ ...prev, websites: updatedWebsites }));
    validateField('websites', updatedWebsites);
  };

  const removeWebsite = (index: number) => {
    const updatedWebsites = [...(formData.websites || [])];
    
    // Si eliminamos el primario y hay otros, hacer primario al primero
    if ((formData.websites || [])[index].is_primary && updatedWebsites.length > 0) {
      updatedWebsites[0].is_primary = true;
    }
    
    setFormData(prev => ({ ...prev, websites: updatedWebsites }));
    validateField('websites', updatedWebsites);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error instanceof Error) {
        setErrors(prev => ({
          ...prev,
          submit: error.message
        }));
      }
    }
  };

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

      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre del Cliente *"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Ej: Empresa ABC S.A."
          error={errors.name}
          disabled={isLoading}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <Input
          label="Email *"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="contacto@empresa.com"
          error={errors.email}
          disabled={isLoading}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Teléfono y Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Teléfono"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="+502 1234-5678"
          error={errors.phone}
          disabled={isLoading}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
        />

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

      {/* Websites */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Sitios Web
          </label>
          <button
            type="button"
            onClick={addWebsite}
            disabled={isLoading || (formData.websites || []).length >= 5}
            className="bg-[#c9f31d] text-gray-900 px-3 py-1 rounded-full text-xs hover:bg-[#b8e019] transition-all duration-200 disabled:opacity-50"
          >
            + Agregar Website
          </button>
        </div>

        {(formData.websites || []).map((website, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-2xl p-4 mb-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Input
                label={`URL ${index + 1} *`}
                value={website.url}
                onChange={(e) => updateWebsite(index, 'url', e.target.value)}
                placeholder="https://ejemplo.com"
                error={errors[`websites[${index}].url`]}
                disabled={isLoading}
              />

              <Input
                label="Descripción"
                value={website.description || ''}
                onChange={(e) => updateWebsite(index, 'description', e.target.value)}
                placeholder="Descripción del sitio"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`primary-${index}`}
                  checked={website.is_primary || false}
                  onChange={(e) => updateWebsite(index, 'is_primary', e.target.checked)}
                  disabled={isLoading}
                  className="rounded border-gray-300 text-[#c9f31d] focus:ring-[#c9f31d]"
                />
                <label htmlFor={`primary-${index}`} className="text-sm text-gray-700">
                  Sitio principal
                </label>
              </div>

              <button
                type="button"
                onClick={() => removeWebsite(index)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        ))}

        {errors.websites && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.websites}
          </motion.p>
        )}
      </div>

      {/* Notas */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows={4}
          className={getInputClassName('notes')}
          placeholder="Notas adicionales sobre el cliente..."
          disabled={isLoading}
        />
        {errors.notes && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.notes}
          </motion.p>
        )}
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
          disabled={isLoading || isValidating}
          className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c9f31d] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-card hover:shadow-card-hover font-medium"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>{mode === 'create' ? 'Creando...' : 'Guardando...'}</span>
            </div>
          ) : (
            mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'
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
                <li>El nombre debe ser descriptivo y único</li>
                <li>El email será usado para comunicaciones importantes</li>
                <li>Solo un sitio web puede ser marcado como principal</li>
                <li>Los prospectos pueden convertirse en clientes activos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.form>
  );
};