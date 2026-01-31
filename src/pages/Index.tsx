import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Users, ClipboardCheck, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Structured Onboarding',
    description: 'Step-by-step registration process to collect all required intern information.',
  },
  {
    icon: ClipboardCheck,
    title: 'Task Management',
    description: 'Sequential task progression with admin approval workflow.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Separate dashboards for interns and administrators.',
  },
];

const benefits = [
  'Complete mandatory registration steps',
  'View and submit assigned tasks',
  'Track your progress in real-time',
  'Receive admin feedback on submissions',
];

export default function Index() {
  return (
    <div className="min-h-screen gradient-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">Prima Interns</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="gradient-primary hover:opacity-90">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <GraduationCap className="w-4 h-4" />
            Intern Registration & Task Management
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
            Streamline Your
            <span className="block gradient-hero bg-clip-text text-transparent">Internship Program</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete platform for managing intern onboarding, task assignments, and progress tracking. 
            Designed for structured workflows and admin oversight.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="gradient-primary hover:opacity-90 text-lg px-8 shadow-elevated">
                Register as Intern
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold text-foreground">
            Everything You Need
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            A comprehensive system for managing your internship program efficiently.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-card hover:shadow-elevated transition-shadow border-0">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">
              For Interns
            </h2>
            <p className="text-muted-foreground mb-8">
              Complete your registration, view your assigned tasks, and track your progress 
              throughout the internship program.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-2xl p-8 shadow-lg border">
            <div className="space-y-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                    {step}
                  </div>
                  <div>
                    <p className="font-medium">
                      {step === 1 && 'Create your account'}
                      {step === 2 && 'Complete registration'}
                      {step === 3 && 'Start your tasks'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step === 1 && 'Sign up with your email'}
                      {step === 2 && 'Personal & college details'}
                      {step === 3 && 'Sequential task workflow'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 md:py-24">
        <Card className="gradient-hero border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-display font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join our internship program today and begin your journey towards professional growth.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Register Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">Prima Interns</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Prima Interns. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
