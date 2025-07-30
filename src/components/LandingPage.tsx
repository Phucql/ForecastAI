import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  Database,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Powerful forecasting algorithms with real-time data analysis and predictive modeling.'
    },
    {
      icon: TrendingUp,
      title: 'Demand Planning',
      description: 'Intelligent demand forecasting with customizable parameters and multiple scenarios.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with encrypted data transmission and secure cloud storage.'
    },
    {
      icon: Zap,
      title: 'Real-time Processing',
      description: 'Lightning-fast processing with automated workflows and instant results.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Multi-user support with role-based access control and team management.'
    },
    {
      icon: Database,
      title: 'Data Integration',
      description: 'Seamless integration with existing systems and multiple data sources.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Supply Chain Manager',
      company: 'TechCorp Inc.',
      content: 'ForecastAI has revolutionized our demand planning process. The accuracy is incredible!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Operations Director',
      company: 'Global Retail',
      content: 'The real-time analytics and intuitive interface make forecasting a breeze.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Business Analyst',
      company: 'Manufacturing Plus',
      content: 'Outstanding tool for data-driven decision making. Highly recommended!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ForecastAI
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Intelligent
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Forecasting</span>
              <br />
              for Modern Business
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your business with AI-powered demand forecasting. Get accurate predictions, 
              real-time analytics, and actionable insights to drive growth and optimize operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Start Forecasting Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
                Watch Demo
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/50 backdrop-blur-sm border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-2">99.2%</div>
                <div className="text-gray-600">Forecast Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-2">50+</div>
                <div className="text-gray-600">Enterprise Clients</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
                <div className="text-gray-600">Real-time Processing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Forecasting
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create accurate forecasts, analyze trends, and make data-driven decisions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover:bg-gray-100 transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers say about ForecastAI
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Forecasting?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies already using ForecastAI to make better business decisions.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">ForecastAI</h3>
            <p className="text-gray-400 mb-6">
              Intelligent forecasting for the modern enterprise
            </p>
            <div className="flex justify-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-400">
              <p>&copy; 2024 ForecastAI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 