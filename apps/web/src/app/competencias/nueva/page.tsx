"use client";

/**
 * Página para crear nueva competencia
 * 
 * Solo accesible por entrenadores (RBAC protegido)
 * Utiliza CompetenciaForm en modo 'create'
 */

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { EntrenadorOnly } from '@/components/auth';
import { CompetenciaForm } from '@/components/competencias';
import { Button } from '@/components/ui';

// ============================================================================
// COMPONENTE DE LOADING
// ============================================================================

function CompetenciaFormLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="border-b pb-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
        </div>
        
        {/* Form fields skeleton */}
        <div className="space-y-4">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
        
        {/* Buttons skeleton */}
        <div className="flex gap-4 pt-6 border-t">
          <div className="flex-1 h-12 bg-gray-200 rounded"></div>
          <div className="flex-1 h-12 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function NuevaCompetenciaPage() {
  return (
    <EntrenadorOnly>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link 
                href="/dashboard" 
                className="hover:text-green-600 transition-colors"
              >
                Dashboard
              </Link>
              <span>/</span>
              <Link 
                href="/competencias" 
                className="hover:text-green-600 transition-colors"
              >
                Competencias
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Nueva</span>
            </div>
          </nav>

          {/* Back Button */}
          <div className="mb-6">
            <Link href="/competencias">
              <Button variant="outline" className="flex items-center">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver a Competencias
              </Button>
            </Link>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <Suspense fallback={<CompetenciaFormLoading />}>
              <CompetenciaForm mode="create" />
            </Suspense>
          </div>

        </div>
      </div>
    </EntrenadorOnly>
  );
}
