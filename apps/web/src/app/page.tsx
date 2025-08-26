'use client';

/**
 * Landing Page de AquaLytics
 * 
 * Página informativa moderna con:
 * - Diseño elegante y responsive
 * - CTAs claros hacia login/registro
 * - Beneficios y características principales
 * - Tema verde consistente
 * - Optimizada para conversión
 */

import Link from 'next/link';
import { useState } from 'react';
import { SimpleLayout } from '@/components/layout';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { 
  ArrowRight, 
  BarChart3, 
  Users, 
  Trophy, 
  Timer, 
  Target, 
  Zap,
  CheckCircle,
  Play,
  Star,
  TrendingUp,
  Shield,
  Smartphone,
  Clock
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

function FeatureCard({ icon, title, description, badge }: FeatureCardProps) {
  return (
    <Card className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 card-hover border-0 bg-gradient-to-br from-white via-green-50/30 to-green-100/20 dark:from-gray-900 dark:via-green-950/30 dark:to-green-900/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
            {badge && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {badge}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {number}
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <SimpleLayout className="overflow-hidden">
      {/* Navigation Header */}
      <header className="backdrop-blur-glass border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏊</span>
              </div>
              <span className="text-xl font-bold text-foreground">AquaLytics</span>
              <Badge variant="secondary" className="text-xs">MVP</Badge>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                Características
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                Cómo Funciona
              </a>
              <a href="#benefits" className="text-muted-foreground hover:text-primary transition-colors">
                Beneficios
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-white dark:from-green-950 dark:via-blue-950 dark:to-gray-900"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge className="mb-4" variant="secondary">
                ✨ Plataforma MVP para Equipos de Natación
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
                Analiza el Rendimiento
                <br />
                de tu <span className="text-primary">Equipo de Natación</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Registra resultados en tiempo real, visualiza estadísticas detalladas y mejora el rendimiento 
                de tus nadadores con análisis inteligentes y comparaciones precisas.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="rounded-full text-base px-8 py-3 shadow-lg hover:shadow-xl transition-all">
                  <Play className="mr-2 h-5 w-5" />
                  Comenzar Ahora
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="rounded-full text-base px-8 py-3">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Ver Demo
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Registro en vivo
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Análisis instantáneo
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                100% en español
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary">Características Principales</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Todo lo que necesitas para gestionar tu equipo
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Una plataforma completa diseñada específicamente para entrenadores y equipos de natación
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Timer className="h-6 w-6 text-white" />}
              title="Registro en Tiempo Real"
              description="Captura resultados durante las competencias con validación automática de tiempos y segmentos."
              badge="¡Nuevo!"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-white" />}
              title="Análisis Avanzado"
              description="Visualiza el pacing, fortalezas, debilidades y compara rendimiento vs equipo."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-white" />}
              title="Gestión de Nadadores"
              description="Organiza tu equipo, categorías, y mantén perfiles detallados de cada atleta."
            />
            <FeatureCard
              icon={<Trophy className="h-6 w-6 text-white" />}
              title="Competencias"
              description="Programa y gestiona competencias con fechas, sedes y resultados organizados."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6 text-white" />}
              title="Métricas de Rendimiento"
              description="KPIs automáticos, récords personales y estadísticas de mejora continua."
            />
            <FeatureCard
              icon={<Smartphone className="h-6 w-6 text-white" />}
              title="Responsive Design"
              description="Optimizado para tablets y laptops, perfecto para uso en competencias."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary">Proceso Simple</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Cómo funciona AquaLytics
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              En solo 4 pasos simples, convierte los datos de natación en insights valiosos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <StepCard
              number="1"
              title="Configura tu Equipo"
              description="Registra a tus nadadores, crea competencias y organiza las pruebas que necesitas trackear."
            />
            <StepCard
              number="2"
              title="Registra Resultados"
              description="Usa nuestro stepper intuitivo para capturar tiempos por segmentos en tiempo real."
            />
            <StepCard
              number="3"
              title="Visualiza Análisis"
              description="Obtén insights automáticos: pacing, comparaciones, fortalezas y áreas de mejora."
            />
            <StepCard
              number="4"
              title="Mejora Rendimiento"
              description="Toma decisiones basadas en datos y optimiza el entrenamiento de cada nadador."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="secondary">¿Por qué AquaLytics?</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Beneficios para tu equipo
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Ahorra Tiempo</h3>
                  <p className="text-muted-foreground">No más hojas de cálculo manuales. Registra y analiza datos en una fracción del tiempo.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Mejores Resultados</h3>
                  <p className="text-muted-foreground">Identifica patrones y optimiza entrenamientos basados en datos reales de rendimiento.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Datos Seguros</h3>
                  <p className="text-muted-foreground">Información protegida y accesible solo para tu equipo con roles bien definidos.</p>
                </div>
              </div>
            </div>

            <div className="lg:pl-12">
              <Card className="rounded-xl shadow-lg border-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">60%</div>
                    <p className="text-sm text-muted-foreground">Menos tiempo en análisis manual</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">100%</div>
                    <p className="text-sm text-muted-foreground">En español, diseñado para equipos locales</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">24/7</div>
                    <p className="text-sm text-muted-foreground">Acceso desde cualquier dispositivo</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                ¿Listo para optimizar tu equipo?
              </h2>
              <p className="text-xl text-green-100 max-w-2xl mx-auto">
                Únete a los entrenadores que ya están mejorando el rendimiento de sus nadadores con AquaLytics.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="rounded-full text-base px-8 py-3 shadow-lg hover:shadow-xl transition-all">
                  <Zap className="mr-2 h-5 w-5" />
                  Comenzar Gratis
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="rounded-full text-base px-8 py-3 border-white text-white hover:bg-white hover:text-primary">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-green-100">
              Sin tarjeta de crédito requerida • Configuración en menos de 5 minutos
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏊</span>
              </div>
              <span className="text-xl font-bold text-foreground">AquaLytics</span>
            </div>
            
            <p className="text-muted-foreground max-w-md mx-auto">
              La plataforma MVP para equipos de natación que buscan optimizar el rendimiento con datos.
            </p>
            
            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground">
                © 2024 AquaLytics MVP. Hecho con 💚 para la comunidad de natación.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </SimpleLayout>
  );
}