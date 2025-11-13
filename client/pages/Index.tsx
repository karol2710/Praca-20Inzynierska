import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowRight, Zap, Shield, Rocket, CheckCircle } from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Deploy Kubernetes configurations in minutes. Streamline your workflow with intelligent configuration management.",
    },
    {
      icon: Shield,
      title: "Secure by Default",
      description: "Built with security in mind. Manage your configurations safely with role-based access and audit trails.",
    },
    {
      icon: Rocket,
      title: "Powerful & Flexible",
      description: "From simple deployments to complex multi-resource orchestration. Deploy your infrastructure with ease.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Choose Your Path",
      description: "Select between Standard (simple) or Advanced (customizable) configuration deployment",
    },
    {
      number: "2",
      title: "Configure",
      description: "Define workloads, resources, and deployment settings with our intuitive configuration builder",
    },
    {
      number: "3",
      title: "Deploy",
      description: "Execute your configuration and deploy your applications to Kubernetes instantly",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-40 right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Kubernetes Configuration{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Deployer
              </span>
            </h1>
            <p className="text-xl text-foreground/70 mb-8">
              Manage and deploy Kubernetes configurations with ease. Whether you're just getting started or managing complex multi-resource applications, we have you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary inline-flex items-center justify-center gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-secondary inline-flex items-center justify-center gap-2">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose Our Deployer?</h2>
            <p className="text-lg text-foreground/60">Everything you need to manage Kubernetes configurations effectively</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-foreground/60">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-card border-t border-border">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-foreground/60">Three simple steps to deploy your Kubernetes applications</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}

                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-bold text-2xl mb-4 mx-auto">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-foreground text-center mb-2">{step.title}</h3>
                  <p className="text-foreground/60 text-center">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Options Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Two Powerful Options</h2>
            <p className="text-lg text-foreground/60">Choose the approach that works best for you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard Option */}
            <div className="bg-card border border-border rounded-xl p-8 hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Standard</h3>
              <p className="text-foreground/60 mb-6">Perfect for quick deployments and existing charts</p>
              <ul className="space-y-3 mb-8">
                {["Upload existing chart file", "Provide repository link", "Add kubectl install command", "Deploy instantly"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-foreground/70">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Advanced Option */}
            <div className="bg-card border border-accent/50 rounded-xl p-8 hover:border-accent transition-all hover:shadow-lg ring-1 ring-accent/20">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Rocket className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Advanced</h3>
              <p className="text-foreground/60 mb-6">For complex setups and custom configurations</p>
              <ul className="space-y-3 mb-8">
                {["Create multiple workflows", "Configure custom containers", "Manage environment variables", "Full customization control"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-foreground/70">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-foreground/60 mb-8">Join thousands of developers simplifying their Kubernetes deployments</p>
          <Link
            to="/signup"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            Create Your First Chart <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
