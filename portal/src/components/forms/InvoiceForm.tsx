// src/components/forms/InvoiceForm.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Invoice, CreateInvoiceData } from '../../types/invoice';
import type { ClientOption } from '../../types/client';
import { Input } from '../ui/Input';
import { 
  validateCreateInvoice, 
  validateUpdateInvoice, 
  validateInvoiceNumber,
  validateInvoiceAmount,
  validateInvoiceDate,
  validateInvoiceClient,
  getFirstErrorByField,
  type ValidationResult 
} from '../../utils/validators/invoice-validator';
import { getInvoiceFormOptions } from '../../utils/formatters/invoice-formatter';

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: CreateInvoiceData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  clients: ClientOption[];
  onGenerateNumber?: () => Promise<string>;
  onUploadFile?: (file: File) => Promise<string>; // Retorna el UUID del archivo
}

export const InvoiceForm = ({
  invoice,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
  clients,
  onGenerateNumber,
  onUploadFile
}: InvoiceFormProps) => {
  const [formData, setFormData] = useState<CreateInvoiceData>({
    invoice_number: '',
    client_id: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    amount: '0.00',
    status: 'draft',
    notes: '',
    invoice_file: undefined
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Obtener opciones del formulario
  const formOptions = getInvoiceFormOptions();

  // DEBUG: Verificar que llegan los clients
  console.log('🔍 InvoiceForm clients:', clients);

  // Cargar datos existentes en modo edición
  useEffect(() => {
    if (mode === 'edit' && invoice) {
      setFormData({
        invoice_number: invoice.invoice_number,
        client_id: typeof invoice.client_id === 'object' ? invoice.client_id.id : invoice.client_id,
        invoice_date: invoice.invoice_date.split('T')[0],
        amount: invoice.amount,
        status: invoice.status,
        notes: invoice.notes || '',
        invoice_file: invoice.invoice_file
      });
    }
  }, [invoice, mode]);

  // Validación en tiempo real
  const validateField = (name: string, value: string | number) => {
    let fieldValidation: ValidationResult;

    switch (name) {
      case 'invoice_number':
        fieldValidation = validateInvoiceNumber(value as string);
        break;
      case 'amount':
        fieldValidation = validateInvoiceAmount(value as string);
        break;
      case 'invoice_date':
        fieldValidation = validateInvoiceDate(value as string);
        break;
      case 'client_id':
        fieldValidation = validateInvoiceClient(value as number);
        break;
      default:
        // Para otros campos, usar validación completa del formulario
        const tempData = { ...formData, [name]: value };
        fieldValidation = mode === 'create' 
          ? validateCreateInvoice(tempData)
          : validateUpdateInvoice(tempData);
        break;
    }

    const fieldErrors = getFirstErrorByField(fieldValidation.errors);
    
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: fieldErrors[name] || ''
    }));

    return fieldValidation.isValid;
  };

  // Validación completa del formulario
  const validateForm = (): boolean => {
    setIsValidating(true);
    
    const validation = mode === 'create'
      ? validateCreateInvoice(formData)
      : validateUpdateInvoice(formData);

    const fieldErrors = getFirstErrorByField(validation.errors);
    setErrors(fieldErrors);
    
    setIsValidating(false);
    return validation.isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue: string | number = value;
    
    if (name === 'client_id') {
      processedValue = parseInt(value) || 0;
    }
    
    setFormData((prev: CreateInvoiceData) => ({ 
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

  // Generar número automático
  const handleGenerateNumber = async () => {
    if (!onGenerateNumber) return;
    
    try {
      setIsGeneratingNumber(true);
      const newNumber = await onGenerateNumber();
      setFormData(prev => ({ ...prev, invoice_number: newNumber }));
      
      // Limpiar error si había
      if (errors.invoice_number) {
        setErrors(prev => ({ ...prev, invoice_number: '' }));
      }
    } catch (error) {
      console.error('Error generating invoice number:', error);
      setErrors(prev => ({
        ...prev,
        invoice_number: 'Error generating number'
      }));
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  // Manejo de archivos
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📁 File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // Validar tipo de archivo (pdf, png, jpg, docx)
    const allowedTypes = [
      'application/pdf',
      'image/png', 
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        invoice_file: 'Solo se permiten archivos PDF, PNG, JPG o DOCX'
      }));
      return;
    }

    setSelectedFile(file);
    
    // Limpiar error si había
    if (errors.invoice_file) {
      setErrors(prev => ({ ...prev, invoice_file: '' }));
    }

    // Subir archivo si hay función de upload
    if (onUploadFile) {
      try {
        setIsUploadingFile(true);
        console.log('🚀 Starting file upload...');
        const fileUuid = await onUploadFile(file);
        console.log('✅ File uploaded successfully, UUID:', fileUuid);
        setFormData(prev => ({ ...prev, invoice_file: fileUuid }));
      } catch (error) {
        console.error('❌ Error uploading file:', error);
        setErrors(prev => ({
          ...prev,
          invoice_file: 'Error al subir el archivo'
        }));
        setSelectedFile(null);
      } finally {
        setIsUploadingFile(false);
      }
    }
  };

  // Remover archivo
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, invoice_file: undefined }));
    
    // Limpiar el input file
    const fileInput = document.getElementById('invoice_file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Limpiar error si había
    if (errors.invoice_file) {
      setErrors(prev => ({ ...prev, invoice_file: '' }));
    }
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

      {/* Número de Factura */}
      <div>
        <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-2">
          Número de Factura *
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="invoice_number"
            name="invoice_number"
            value={formData.invoice_number}
            onChange={handleInputChange}
            className={getInputClassName('invoice_number')}
            placeholder="INV-2025-01-001"
            disabled={isLoading}
          />
          {onGenerateNumber && mode === 'create' && (
            <button
              type="button"
              onClick={handleGenerateNumber}
              disabled={isLoading || isGeneratingNumber}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all duration-200 whitespace-nowrap disabled:opacity-50"
            >
              {isGeneratingNumber ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin"></div>
                  <span>Generando...</span>
                </div>
              ) : (
                'Auto'
              )}
            </button>
          )}
        </div>
        {errors.invoice_number && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.invoice_number}
          </motion.p>
        )}
      </div>

      {/* Cliente y Estado */}
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
                {option.icon} {option.label}
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

      {/* Fecha y Monto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="Fecha de Factura *"
          name="invoice_date"
          value={formData.invoice_date}
          onChange={handleInputChange}
          error={errors.invoice_date}
          disabled={isLoading}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <Input
          type="number"
          label="Monto *"
          name="amount"
          value={formData.amount}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.amount}
          disabled={isLoading}
          icon={
            <span className="text-gray-500">Q</span>
          }
        />
      </div>

      {/* Archivo de Factura */}
      <div>
        <label htmlFor="invoice_file" className="block text-sm font-medium text-gray-700 mb-2">
          Archivo de Factura
        </label>
        
        {/* Mostrar archivo existente */}
        {formData.invoice_file && !selectedFile && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-700 text-sm">Archivo cargado</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={`/assets/${formData.invoice_file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Ver archivo
                </a>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input de archivo */}
        <div className="relative">
          <input
            type="file"
            id="invoice_file"
            accept=".pdf,.png,.jpg,.jpeg,.docx"
            onChange={handleFileChange}
            disabled={isLoading || isUploadingFile}
            className="hidden"
          />
          <label
            htmlFor="invoice_file"
            className={`
              w-full px-4 py-3 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-center
              ${errors.invoice_file 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 bg-gray-50 hover:border-[#c9f31d] hover:bg-[#c9f31d]/5'
              }
              ${(isLoading || isUploadingFile) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isUploadingFile ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-gray-400/20 border-t-gray-400 rounded-full animate-spin"></div>
                <span className="text-gray-700 text-sm">Subiendo archivo...</span>
              </div>
            ) : selectedFile ? (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700 text-sm">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-gray-700 text-sm">
                  Seleccionar archivo (PDF, PNG, JPG, DOCX)
                </span>
              </div>
            )}
          </label>
        </div>

        {errors.invoice_file && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {errors.invoice_file}
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
          placeholder="Notas adicionales sobre la factura..."
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
          disabled={isLoading || isValidating || isUploadingFile || Object.values(errors).some(error => error !== '')}
          className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c9f31d] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-card hover:shadow-card-hover font-medium"
        >
          {isLoading || isUploadingFile ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>
                {isUploadingFile ? 'Subiendo archivo...' : mode === 'create' ? 'Creando...' : 'Guardando...'}
              </span>
            </div>
          ) : (
            mode === 'create' ? 'Crear Factura' : 'Guardar Cambios'
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
                <li>Usa el botón "Auto" para generar números únicos automáticamente</li>
                <li>El formato recomendado es INV-YYYY-MM-NNN</li>
                <li>Puedes subir archivos PDF, PNG, JPG o DOCX</li>
                <li>El archivo se guarda automáticamente en S3 vía Directus</li>
                <li>Las facturas en estado "Pagada" no se pueden modificar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info en desarrollo */}
      {import.meta.env.DEV && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mt-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">🔧 Debug - Form Data</h4>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify({ 
              formData,
              errors: Object.keys(errors).filter(key => errors[key]).length > 0 ? errors : 'No errors',
              clientCount: clients.length
            }, null, 2)}
          </pre>
        </div>
      )}
    </motion.form>
  );
};