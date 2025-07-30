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
  Star,
  Target,
  Lightbulb,
  Smartphone,
  Monitor,
  Settings,
  Cloud,
  Building
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const processSteps = [
    {
      step: "Step 1",
      title: "Demand forecast",
      subtitle: "We forecast exactly how many items you'll sell",
      description: "We train a custom forecasting algorithm that is unique to you, by ingesting your internal data and relevant external data into our proprietary machine learning model.",
      icon: Target,
      learnMore: "Learn more about our forecasting"
    },
    {
      step: "Step 2", 
      title: "Actionable recommendations",
      subtitle: "We convert forecasts into actionable recommendations",
      description: "Based on current stock, case sizes, and other operational complexities, our AI recommendations algorithm turns forecasts into recommendations for ordering and production planning.",
      icon: Lightbulb,
      learnMore: "Learn more about our recommendations"
    },
    {
      step: "Step 3",
      title: "Products for store teams", 
      subtitle: "Our products integrate recommendations with store workflows",
      description: "With our products, store teams place more accurate orders and run more efficient operations with AI-powered insights and automation.",
      icon: Smartphone,
      learnMore: "Learn more about our products"
    }
  ];

  const products = [
    {
      title: "Demand Planning App",
      description: "Using KLUGAI's recommendations, plan the perfect amount of inventory, faster and more accurately.",
      icon: TrendingUp,
      learnMore: "Learn more"
    },
    {
      title: "Production Planning",
      description: "Using KLUGAI's recommendations, produce the perfect amount of goods every time.",
      icon: BarChart3,
      learnMore: "Learn more"
    },
    {
      title: "Head Office Dashboard",
      description: "Oversee and manage your operations with comprehensive analytics and insights.",
      icon: Monitor,
      learnMore: "Learn more"
    }
  ];

  const integrations = [
    { name: "ERP Systems", icon: Database },
    { name: "CRM Platforms", icon: Users },
    { name: "Cloud Storage", icon: Cloud },
    { name: "Business Intelligence", icon: BarChart3 },
    { name: "Supply Chain", icon: Building },
    { name: "Analytics Tools", icon: TrendingUp }
  ];

  const caseStudies = [
    {
      title: "99% Accurate Demand Forecasting for Food Products",
      company: "Major Food Retailer",
      industry: "Food & Beverage",
      results: [
        "99% forecast accuracy achieved",
        "30% reduction in food waste",
        "25% improvement in inventory turnover",
        "15% increase in profit margins"
      ],
      description: "How KLUGAI helped a major food retailer achieve unprecedented forecasting accuracy and reduce waste while improving profitability.",
      image: "/KLUGAI_logo.png"
    },
    {
      title: "AI-Powered Supply Chain Optimization",
      company: "Manufacturing Giant",
      industry: "Manufacturing",
      results: [
        "40% reduction in stockouts",
        "50% faster demand response",
        "20% cost savings in logistics",
        "35% improvement in customer satisfaction"
      ],
      description: "Transforming a global manufacturing company's supply chain with intelligent forecasting and real-time optimization.",
      image: "/KLUGAI_logo.png"
    },
    {
      title: "Retail Inventory Management Revolution",
      company: "National Retail Chain",
      industry: "Retail",
      results: [
        "45% reduction in excess inventory",
        "60% faster replenishment cycles",
        "28% increase in sales",
        "22% reduction in carrying costs"
      ],
      description: "Revolutionizing inventory management for a national retail chain with predictive analytics and automated ordering.",
      image: "/KLUGAI_logo.png"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <img src="/KLUGAI_logo.png" alt="KLUGAI Logo" className="h-10 w-auto" />
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#case-studies" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
                Case Studies
              </a>
              <a href="#blog" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
                Blog
              </a>
              <button
                onClick={onGetStarted}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition-all duration-200 flex items-center gap-2"
              >
                Request a demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              AI-first solutions built around your unique needs
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Solutions unique to each business: from our forecasting algorithm to our products, 
              we work closely with you to customize our solution around your needs.
            </p>
            <button
              onClick={onGetStarted}
              className="bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
            >
              Request a demo
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our 3-step process to optimize your operations
            </h2>
          </div>
          
          <div className="space-y-20">
            {processSteps.map((step, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}>
                <div className="flex-1">
                  <div className="mb-4">
                    <span className="text-orange-600 font-semibold text-lg">{step.step}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <h4 className="text-xl font-semibold text-gray-700 mb-4">
                    {step.subtitle}
                  </h4>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>
                  <button className="text-orange-600 font-medium hover:text-orange-700 transition-colors flex items-center gap-2">
                    {step.learnMore}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="w-80 h-80 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
                    <step.icon className="w-32 h-32 text-orange-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Products
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                  <product.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{product.title}</h3>
                <p className="text-gray-600 mb-6">{product.description}</p>
                <button className="text-orange-600 font-medium hover:text-orange-700 transition-colors flex items-center gap-2">
                  {product.learnMore}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

             {/* Integrations Section */}
       <section className="py-20 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-bold text-gray-900 mb-4">
               Integrations
             </h2>
             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
               Fully integrated with your existing ecosystem. Instead of a one-size-fits-all approach, 
               we set up custom integrations with your existing systems and tech infrastructure so that 
               our solution becomes part of your cohesive ecosystem.
             </p>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
             {integrations.map((integration, index) => (
               <div key={index} className="text-center">
                 <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                   <integration.icon className="w-8 h-8 text-gray-600" />
                 </div>
                 <p className="text-sm font-medium text-gray-700">{integration.name}</p>
               </div>
             ))}
           </div>
         </div>
       </section>

       {/* Case Studies Section */}
       <section id="case-studies" className="py-20 bg-gray-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
             <h2 className="text-4xl font-bold text-gray-900 mb-4">
               Case Studies
             </h2>
             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
               See how KLUGAI is transforming businesses across industries with AI-powered forecasting solutions.
             </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {caseStudies.map((study, index) => (
               <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
                 <div className="p-8">
                   <div className="flex items-center mb-4">
                     <img src={study.image} alt={`${study.company} logo`} className="h-8 w-auto mr-3" />
                     <div>
                       <p className="text-sm font-medium text-gray-600">{study.industry}</p>
                       <p className="text-sm text-gray-500">{study.company}</p>
                     </div>
                   </div>
                   
                   <h3 className="text-xl font-semibold text-gray-900 mb-3">
                     {study.title}
                   </h3>
                   
                   <p className="text-gray-600 mb-6">
                     {study.description}
                   </p>
                   
                   <div className="space-y-2 mb-6">
                     {study.results.map((result, resultIndex) => (
                       <div key={resultIndex} className="flex items-center">
                         <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                         <span className="text-sm text-gray-700">{result}</span>
                       </div>
                     ))}
                   </div>
                   
                   <button className="text-orange-600 font-medium hover:text-orange-700 transition-colors flex items-center gap-2">
                     Read full case study
                     <ArrowRight className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             ))}
           </div>
           
           <div className="text-center mt-12">
             <button className="bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-all duration-200 flex items-center justify-center gap-2 mx-auto">
               View all case studies
               <ArrowRight className="w-5 h-5" />
             </button>
           </div>
         </div>
       </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Meet with our team
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            We know that every business is different and that each department has its own unique needs. 
            Share with us your specific business needs, and we'll build a solution that is perfect for you.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-700 transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
          >
            Request a demo
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/KLUGAI_logo.png" alt="KLUGAI Logo" className="h-8 w-auto" />
                <h3 className="text-xl font-bold">KLUGAI</h3>
              </div>
              <p className="text-gray-400">
                AI-powered forecasting & replenishment for modern business
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Overview</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Forecasting</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Products</a></li>
              </ul>
            </div>
            
                         <div>
               <h4 className="font-semibold mb-4">Company</h4>
               <ul className="space-y-2 text-gray-400">
                 <li><a href="#" className="hover:text-white transition-colors">About us</a></li>
                 <li><a href="#blog" className="hover:text-white transition-colors">Blog</a></li>
                 <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
               </ul>
             </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Request a demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 KLUGAI, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 