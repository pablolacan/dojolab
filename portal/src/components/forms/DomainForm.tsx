// src/components/forms/DomainForm.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Domain, CreateDomainData, Client, Provider } from '../../types/domain';
import { Input } from '../ui/Input';

interface DomainFormProps {
  domain?: Domain;
  onSubmit: (data: CreateDomainData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  clients: Client[];
  providers: Provider[];
}

export const DomainForm = ({
  domain,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
  clients,
  providers
}: DomainFormProps) => {
  const [formData, setFormData] = useState<CreateDomainData>({
    domain_: '',
    client_id: 0,
    provider_id: 0,
    purchase_date: '',
    expiration_date: '',
    renewal_price: '0.00',
    status: 'active',
    dns_provider: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // DEBUG: Verificar que llegan los providers
  console.log('🔍 DomainForm providers:', providers);
  console.log('🔍 DomainForm clients:', clients);

  // Cargar datos existentes en modo edición
  useEffect(() => {
    if (mode === 'edit' && domain) {
      setFormData({
        domain_: domain.domain_,
        client_id: typeof domain.client_id === 'object' ? domain.client_id.id : domain.client_id,
        provider_id: typeof domain.provider_id === 'object' ? domain.provider_id.id : domain.provider_id,
        purchase_date: domain.purchase_date?.split('T')[0] || '',
        expiration_date: domain.expiration_date.split('T')[0],
        renewal_price: domain.renewal_price,
        status: domain.status,
        dns_provider: domain.dns_provider || '',
        notes: domain.notes || ''
      });
    }
  }, [domain, mode]);

  // Validación en tiempo real
  const validateField = (name: string, value: string | number) => {
    let error = '';

    switch (name) {
      case 'domain_':
        if (!value || (typeof value === 'string' && value.trim().length < 3)) {
          error = 'El dominio debe tener al menos 3 caracteres';
        } else if (typeof value === 'string' && !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(value.trim())) {
          error = 'Formato de dominio inválido (ej: ejemplo.com)';
        }
        break;
      
      case 'client_id':
        if (!value || value === 0) {
          error = 'Debe seleccionar un cliente';
        }
        break;
      
      case 'provider_id':
        if (!value || value === 0) {
          error = 'Debe seleccionar un proveedor';
        }
        break;
      
      case 'expiration_date':
        if (!value) {
          error = 'La fecha de expiración es requerida';
        } else {
          const expirationDate = new Date(value as string);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (isNaN(expirationDate.getTime())) {
            error = 'Fecha inválida';
          } else if (expirationDate < today) {
            error = 'La fecha de expiración no puede ser en el pasado';
          }
        }
        break;
      
      case 'renewal_price':
        const price = parseFloat(value as string);
        if (isNaN(price) || price < 0) {
          error = 'El precio debe ser un número positivo';
        } else if (price > 999999.99) {
          error = 'El precio es demasiado alto';
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    return error === '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue: string | number = value;
    
    if (name === 'client_id' || name === 'provider_id') {
      processedValue = parseInt(value) || 0;
    }
    
    setFormData((prev: CreateDomainData) => ({ 
      ...prev, 
      [name]: processedValue 
    }));
    
    // Limpiar error del campo al cambiar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Validar campo después de un pequeño delay
    setTimeout(() => validateField(name, processedValue), 300);
  };

  const validateForm = (): boolean => {
    const fieldValidations = [
      validateField('domain_', formData.domain_),
      validateField('client_id', formData.client_id),
      validateField('provider_id', formData.provider_id),
      validateField('expiration_date', formData.expiration_date),
      validateField('renewal_price', formData.renewal_price)
    ];

    return fieldValidations.every(Boolean);
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

      {/* Nombre del Dominio */}
      <Input
        label="Dominio *"
        name="domain_"
        value={formData.domain_}
        onChange={handleInputChange}
        placeholder="ejemplo.com"
        error={errors.domain_}
        disabled={isLoading}
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
        }
      />

      {/* Cliente y Proveedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
            Cliente *
          </label>
          <select
            id="client_id"
            name="client_id"
            value={formData.client_id}
            onChange={handleInputChange}
            className={getInputClassName('client_id')}
            disabled={isLoading}
          >
            <option value={0}>Seleccionar cliente</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.email})
              </option>
            ))}
          </select>
          {errors.client_id && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600"
            >
              {errors.client_id}
            </motion.p>
          )}
        </div>

        <div>
          <label htmlFor="provider_id" className="block text-sm font-medium text-gray-700 mb-2">
            Proveedor *
          </label>
          <select
            id="provider_id"
            name="provider_id"
            value={formData.provider_id}
            onChange={handleInputChange}
            className={getInputClassName('provider_id')}
            disabled={isLoading}
          >
            <option value={0}>Seleccionar proveedor</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          {errors.provider_id && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600"
            >
              {errors.provider_id}
            </motion.p>
          )}
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="Fecha de Compra"
          name="purchase_date"
          value={formData.purchase_date}
          onChange={handleInputChange}
          disabled={isLoading}
        />

        <Input
          type="date"
          label="Fecha de Expiración *"
          name="expiration_date"
          value={formData.expiration_date}
          onChange={handleInputChange}
          error={errors.expiration_date}
          disabled={isLoading}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Precio y Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="number"
          label="Precio de Renovación *"
          name="renewal_price"
          value={formData.renewal_price}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          error={errors.renewal_price}
          disabled={isLoading}
          icon={
            <span className="text-gray-500">$</span>
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
            <option value="active">Activo</option>
            <option value="expired">Expirado</option>
            <option value="pending_transfer">Transferencia Pendiente</option>
          </select>
        </div>
      </div>

      {/* DNS Provider */}
      <Input
        label="Proveedor DNS"
        name="dns_provider"
        value={formData.dns_provider}
        onChange={handleInputChange}
        placeholder="Cloudflare, Route53, etc."
        disabled={isLoading}
      />

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
          rows={3}
          className={getInputClassName('notes')}
          placeholder="Notas adicionales sobre el dominio..."
          disabled={isLoading}
        />
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
            mode === 'create' ? 'Crear Dominio' : 'Guardar Cambios'
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
                <li>Usa el formato completo del dominio (ej: ejemplo.com)</li>
                <li>La fecha de expiración debe ser futura</li>
                <li>El proveedor DNS puede ser diferente al registrar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.form>
  );
};