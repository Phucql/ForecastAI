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
  Building,
  Search,
  Minus,
  Plus,
  Leaf
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenContactForm: () => void;
  onOpenLogin: () => void;
  onLogoClick: () => void;
}

export default function LandingPage({ onGetStarted, onOpenContactForm, onOpenLogin, onLogoClick }: LandingPageProps) {
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

  const solutionSteps = [
    {
      step: "Step 1",
      title: "Data Ingestion & Processing",
      subtitle: "We collect and process your business data",
      description: "Our system ingests your internal data including POS transactions, promotions, recipes, product data, availability, pricing, and known losses. We also integrate external data sources like events, weather, holidays, social media trends, sports events, and local school terms - over 240+ external variables.",
      icon: Database,
      learnMore: "Learn more about our data processing"
    },
    {
      step: "Step 2", 
      title: "Actionable Recommendations",
      subtitle: "We convert forecasts into actionable recommendations",
      description: "Based on current stock, case sizes, and other operational complexities of fresh, our AI recommendations algorithm turns forecasts into recommendations for ordering and production planning.",
      icon: Lightbulb,
      learnMore: "Learn more about our recommendations"
    },
    {
      step: "Step 3",
      title: "Products for Store Teams", 
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
                 <button
                   onClick={onLogoClick}
                   className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                 >
                   <img src="/KLUGAI_logo.png" alt="KLUGAI Logo" className="h-10 w-auto" />
                 </button>
               </div>
             </div>
                         <div className="hidden md:flex items-center space-x-8">
               <a href="#solutions" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
                 Solutions
               </a>
               <a href="#case-studies" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
                 Case Studies
               </a>
               <button
                 onClick={onOpenLogin}
                 className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
               >
                 Login
               </button>
               <button
                 onClick={onOpenContactForm}
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
       <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100">
         {/* Background decoration */}
         <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
         <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
         <div className="absolute top-0 right-1/4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
         <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
         
         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
           <div className="text-center">
             <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-8 animate-fade-in-up">
               <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
               AI-Powered Forecasting Platform
             </div>
             
             <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight animate-fade-in-up animation-delay-200">
               AI-first solutions built around your{' '}
               <span className="bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                 unique needs
               </span>
             </h1>
             
             <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
               Solutions unique to each business: from our forecasting algorithm to our products, 
               we work closely with you to customize our solution around your needs.
             </p>
             
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-600">
               <button
                 onClick={onOpenContactForm}
                 className="group bg-gradient-to-r from-orange-600 to-orange-700 text-white px-10 py-5 rounded-xl font-semibold text-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3 shadow-lg"
               >
                 Request a demo
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </button>
               
               <button
                 onClick={onOpenLogin}
                 className="text-gray-700 hover:text-orange-600 transition-colors font-medium text-lg flex items-center gap-2 group"
               >
                 <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                   <span className="w-2 h-2 bg-gray-400 rounded-full group-hover:bg-orange-600 transition-colors"></span>
                 </span>
                 Sign in to your account
               </button>
             </div>
             
             {/* Stats */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-orange-200 animate-fade-in-up animation-delay-800">
               <div className="text-center">
                 <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">99%</div>
                 <div className="text-gray-600">Forecast Accuracy</div>
               </div>
               <div className="text-center">
                 <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">30%</div>
                 <div className="text-gray-600">Reduction in Waste</div>
               </div>
               <div className="text-center">
                 <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">240+</div>
                 <div className="text-gray-600">External Variables</div>
               </div>
             </div>
           </div>
         </div>
       </section>

             

                               {/* Solutions Section */}
         <section id="solutions" className="py-24 bg-gradient-to-br from-gray-50 to-white relative">
           <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
           <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-20">
               <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
                 Data-Driven Approach
               </div>
               <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                 Our 3-step process to optimize your{' '}
                 <span className="bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                   fresh operations
                 </span>
               </h2>
               <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                 A comprehensive data-driven approach that transforms your business data into actionable insights.
               </p>
             </div>
             
             <div className="space-y-24">
               {solutionSteps.map((step, index) => (
                 <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16`}>
                   <div className="flex-1 space-y-6">
                     <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                       {step.step}
                     </div>
                     <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                       {step.title}
                     </h3>
                     <h4 className="text-xl font-semibold text-gray-700">
                       {step.subtitle}
                     </h4>
                     <p className="text-lg text-gray-600 leading-relaxed">
                       {step.description}
                     </p>
                     <button 
                       onClick={onOpenContactForm}
                       className="group inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors text-lg"
                     >
                       {step.learnMore}
                       <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                     </button>
                   </div>
                   <div className="flex-1 flex justify-center">
                     {index === 0 ? (
                       // Custom diagram for Step 1
                       <div className="w-full max-w-2xl">
                         <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                           {/* Internal Data Box */}
                           <div className="bg-orange-50 rounded-xl p-6 mb-6 border border-orange-200">
                             <h4 className="text-lg font-semibold text-orange-800 mb-4">Internal Data</h4>
                             <div className="grid grid-cols-2 gap-3">
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-orange-200 rounded flex items-center justify-center">
                                   <span className="text-orange-700 text-xs font-bold">POS</span>
                                 </div>
                                 <span className="text-sm text-orange-700">Point of Sale</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-orange-200 rounded flex items-center justify-center">
                                   <span className="text-orange-700 text-xs font-bold">PROM</span>
                                 </div>
                                 <span className="text-sm text-orange-700">Promotions</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-orange-200 rounded flex items-center justify-center">
                                   <span className="text-orange-700 text-xs font-bold">REC</span>
                                 </div>
                                 <span className="text-sm text-orange-700">Recipes</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-orange-200 rounded flex items-center justify-center">
                                   <span className="text-orange-700 text-xs font-bold">PROD</span>
                                 </div>
                                 <span className="text-sm text-orange-700">Product Data</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-orange-200 rounded flex items-center justify-center">
                                   <span className="text-orange-700 text-xs font-bold">AVAIL</span>
                                 </div>
                                 <span className="text-sm text-orange-700">Availability</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-orange-200 rounded flex items-center justify-center">
                                   <span className="text-orange-700 text-xs font-bold">PRICE</span>
                                 </div>
                                 <span className="text-sm text-orange-700">Pricing</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-orange-200 rounded flex items-center justify-center">
                                   <span className="text-orange-700 text-xs font-bold">LOSS</span>
                                 </div>
                                 <span className="text-sm text-orange-700">Known Loss</span>
                               </div>
                             </div>
                           </div>

                           {/* External Data Box */}
                           <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
                             <h4 className="text-lg font-semibold text-blue-800 mb-4">External Data</h4>
                             <div className="grid grid-cols-2 gap-3">
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                   <span className="text-blue-700 text-xs font-bold">EVT</span>
                                 </div>
                                 <span className="text-sm text-blue-700">Events</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                   <span className="text-blue-700 text-xs font-bold">WTH</span>
                                 </div>
                                 <span className="text-sm text-blue-700">Weather</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                   <span className="text-blue-700 text-xs font-bold">HOL</span>
                                 </div>
                                 <span className="text-sm text-blue-700">Holidays</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                   <span className="text-blue-700 text-xs font-bold">SOC</span>
                                 </div>
                                 <span className="text-sm text-blue-700">Social Media</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                   <span className="text-blue-700 text-xs font-bold">SPT</span>
                                 </div>
                                 <span className="text-sm text-blue-700">Sports & Concerts</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                   <span className="text-blue-700 text-xs font-bold">SCH</span>
                                 </div>
                                 <span className="text-sm text-blue-700">School Terms</span>
                               </div>
                               <div className="flex items-center space-x-2 col-span-2">
                                 <div className="w-6 h-6 bg-blue-200 rounded flex items-center justify-center">
                                   <span className="text-blue-700 text-xs font-bold">240+</span>
                                 </div>
                                 <span className="text-sm text-blue-700">External Variables</span>
                               </div>
                             </div>
                           </div>

                           {/* Flow Arrows */}
                           <div className="flex justify-center mb-6">
                             <div className="flex items-center space-x-4">
                               <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                                 <span className="text-orange-700 text-sm">↓</span>
                               </div>
                               <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                 <span className="text-blue-700 text-sm">↓</span>
                               </div>
                             </div>
                           </div>

                           {/* Custom Forecasting Algorithm */}
                           <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-6 border border-orange-300">
                             <div className="flex items-center justify-center space-x-4 mb-4">
                               <div className="w-12 h-12 bg-orange-300 rounded-lg flex items-center justify-center">
                                 <span className="text-orange-800 text-lg">⚙️</span>
                               </div>
                               <div className="w-12 h-12 bg-orange-300 rounded-lg flex items-center justify-center">
                                 <span className="text-orange-800 text-lg">⚙️</span>
                               </div>
                               <div className="w-12 h-12 bg-orange-300 rounded-lg flex items-center justify-center">
                                 <span className="text-orange-800 text-lg">⚙️</span>
                               </div>
                             </div>
                             <h4 className="text-lg font-semibold text-orange-800 text-center">Custom Forecasting Algorithm</h4>
                           </div>
                         </div>
                       </div>
                                           ) : index === 1 ? (
                        // Custom diagram for Step 2 - Demand Forecast & Recommendations
                        <div className="w-full max-w-2xl">
                          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                            {/* Demand Forecast Flow */}
                            <div className="mb-8">
                              <div className="flex items-center justify-center mb-4">
                                <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center mr-3">
                                  <Star className="w-4 h-4 text-orange-700" />
                                </div>
                                <span className="text-lg font-semibold text-gray-800">Demand forecast</span>
                              </div>
                              <div className="w-0.5 h-8 bg-orange-300 mx-auto mb-4"></div>
                              
                              {/* Input Factors Circle */}
                              <div className="relative mb-6">
                                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 text-center">
                                    <div className="text-xs font-medium text-orange-700">Display size</div>
                                  </div>
                                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 text-center">
                                    <div className="text-xs font-medium text-orange-700">Current stock</div>
                                  </div>
                                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 text-center">
                                    <div className="text-xs font-medium text-orange-700">Case size</div>
                                  </div>
                                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 text-center">
                                    <div className="text-xs font-medium text-orange-700">Shelf-life</div>
                                  </div>
                                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 text-center">
                                    <div className="text-xs font-medium text-orange-700">Recipes/Ingredients</div>
                                  </div>
                                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 text-center">
                                    <div className="text-xs font-medium text-orange-700">Supplier lead times</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Recommendations Section */}
                            <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                              <h4 className="text-lg font-semibold text-orange-800 mb-4 text-center">Recommendations</h4>
                              
                              {/* Navel Oranges */}
                              <div className="bg-white rounded-lg p-4 mb-4 border border-orange-200">
                                <div className="flex items-center mb-3">
                                  <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-orange-700 text-sm">🍊</span>
                                  </div>
                                  <span className="font-medium text-gray-800">Navel Oranges</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Current stock</label>
                                    <div className="flex items-center border border-gray-300 rounded">
                                      <button className="px-2 py-1 text-gray-500 hover:bg-gray-100">
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="px-3 py-1 text-sm">2</span>
                                      <button className="px-2 py-1 text-gray-500 hover:bg-gray-100">
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Order</label>
                                    <div className="flex items-center border border-gray-300 rounded">
                                      <button className="px-2 py-1 text-gray-500 hover:bg-gray-100">
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="px-3 py-1 text-sm">0</span>
                                      <button className="px-2 py-1 text-gray-500 hover:bg-gray-100">
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center text-sm">
                                  <Leaf className="w-4 h-4 text-green-600 mr-2" />
                                  <span className="text-green-700 font-medium">KLUGAI suggestion: 1</span>
                                </div>
                              </div>

                              {/* Bananas */}
                              <div className="bg-white rounded-lg p-4 border border-orange-200">
                                <div className="flex items-center mb-3">
                                  <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-yellow-700 text-sm">🍌</span>
                                  </div>
                                  <span className="font-medium text-gray-800">Bananas Bunches</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Current stock</label>
                                    <div className="flex items-center border border-gray-300 rounded">
                                      <button className="px-2 py-1 text-gray-500 hover:bg-gray-100">
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="px-3 py-1 text-sm">1</span>
                                      <button className="px-2 py-1 text-gray-500 hover:bg-gray-100">
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600 mb-1 block">Order</label>
                                    <div className="flex items-center border border-gray-300 rounded">
                                      <button className="px-2 py-1 text-gray-500 hover:bg-gray-100">
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="px-3 py-1 text-sm">0</span>
                                      <button className="px-2 py-1 text-gray-500 hover:bg-gray-100">
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center text-sm">
                                  <Leaf className="w-4 h-4 text-green-600 mr-2" />
                                  <span className="text-green-700 font-medium">KLUGAI suggestion: 3</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : index === 2 ? (
                        // Custom diagram for Step 3 - Fresh Ordering & Production Planning
                        <div className="w-full max-w-4xl">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Fresh Ordering Panel */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                              <h4 className="text-xl font-semibold text-orange-800 mb-6 text-center">Fresh ordering</h4>
                              
                              <div className="bg-white rounded-xl p-4 border border-orange-200">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-sm text-gray-600">← Order</span>
                                  <Search className="w-4 h-4 text-gray-500" />
                                </div>
                                
                                {/* Order Items */}
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-yellow-200 rounded flex items-center justify-center">
                                      <span className="text-yellow-700 text-xs">🍌</span>
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-300 rounded"></div>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center border border-gray-300 rounded">
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="px-2 py-1 text-xs">2</span>
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <div className="flex items-center border border-gray-300 rounded">
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="px-2 py-1 text-xs">3</span>
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-red-200 rounded flex items-center justify-center">
                                      <span className="text-red-700 text-xs">🍅</span>
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-300 rounded"></div>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center border border-gray-300 rounded">
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="px-2 py-1 text-xs">2</span>
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <div className="flex items-center border border-gray-300 rounded">
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="px-2 py-1 text-xs">3</span>
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-purple-200 rounded flex items-center justify-center">
                                      <span className="text-purple-700 text-xs">🧅</span>
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-300 rounded"></div>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center border border-gray-300 rounded">
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="px-2 py-1 text-xs">2</span>
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <div className="flex items-center border border-gray-300 rounded">
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="px-2 py-1 text-xs">3</span>
                                        <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <button className="w-full bg-orange-600 text-white py-2 rounded-lg mt-4 text-sm font-medium hover:bg-orange-700 transition-colors">
                                  Continue
                                </button>
                              </div>
                            </div>

                            {/* Production Planning Panel */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                              <h4 className="text-xl font-semibold text-blue-800 mb-6 text-center">Production planning</h4>
                              
                              <div className="bg-white rounded-xl p-4 border border-blue-200">
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-sm text-gray-600">Production planning</span>
                                  <div className="w-4 h-4 bg-blue-200 rounded"></div>
                                </div>
                                
                                {/* Production Tasks */}
                                <div className="space-y-3">
                                  {[1, 2, 3, 4, 5].map((task) => (
                                    <div key={task} className="flex items-center space-x-3">
                                      <div className="w-0.5 h-6 bg-gray-300"></div>
                                      <div className="flex-1 h-2 bg-gray-300 rounded"></div>
                                      <div className="flex items-center space-x-2">
                                        <div className="flex items-center border border-gray-300 rounded">
                                          <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="px-2 py-1 text-xs">2</span>
                                          <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <div className="flex items-center border border-gray-300 rounded">
                                          <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="px-2 py-1 text-xs">2</span>
                                          <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <div className="flex items-center border border-gray-300 rounded">
                                          <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="px-2 py-1 text-xs">4</span>
                                          <button className="px-1 py-1 text-gray-500 hover:bg-gray-100">
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Connecting Arrow */}
                          <div className="flex justify-center mt-6">
                            <div className="flex flex-col items-center">
                              <div className="w-0.5 h-8 bg-orange-300"></div>
                              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">↓</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Regular icon display for other steps
                        <div className="relative group">
                          <div className="w-96 h-96 bg-gradient-to-br from-orange-100 via-orange-50 to-orange-200 rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-orange-200/50 transition-all duration-500 transform group-hover:scale-105">
                            <step.icon className="w-40 h-40 text-orange-600 group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                      )}
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </section>

               {/* Products Section */}
       <section className="py-24 bg-white relative">
         <div className="absolute inset-0 bg-gradient-to-b from-gray-50/30 to-transparent"></div>
         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-20">
             <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
               Our Products
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
               Powerful tools for{' '}
               <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                 modern businesses
               </span>
             </h2>
             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
               Comprehensive solutions designed to streamline your operations and boost efficiency
             </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {products.map((product, index) => (
               <div key={index} className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-orange-200 transition-all duration-500 transform hover:-translate-y-2">
                 <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                   <product.icon className="w-8 h-8 text-orange-600" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">{product.title}</h3>
                 <p className="text-gray-600 mb-8 text-lg leading-relaxed">{product.description}</p>
                 <button 
                   onClick={onOpenContactForm}
                   className="group/btn inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors text-lg"
                 >
                   {product.learnMore}
                   <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
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
        <section id="case-studies" className="py-24 bg-gradient-to-br from-gray-50 to-white relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
                Success Stories
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                See how KLUGAI is{' '}
                <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  transforming businesses
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Real results from companies across industries using our AI-powered forecasting solutions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <div key={index} className="group bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mr-4">
                        <img src={study.image} alt={`${study.company} logo`} className="h-6 w-auto" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-600">{study.industry}</p>
                        <p className="text-sm text-gray-500">{study.company}</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">
                      {study.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      {study.description}
                    </p>
                    
                    <div className="space-y-3 mb-8">
                      {study.results.map((result, resultIndex) => (
                        <div key={resultIndex} className="flex items-center">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{result}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={onOpenContactForm}
                      className="group/btn inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors"
                    >
                      Read full case study
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-16">
              <button 
                onClick={onOpenContactForm}
                className="group bg-gradient-to-r from-purple-600 to-purple-700 text-white px-10 py-5 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3 shadow-lg mx-auto"
              >
                View all case studies
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

             {/* Contact Section */}
       <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
         <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
         <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
         <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
         
         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-500/20 text-orange-300 text-sm font-medium mb-8">
             <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></span>
             Ready to get started?
           </div>
           
           <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
             Meet with our{' '}
             <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
               expert team
             </span>
           </h2>
           
           <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
             We know that every business is different and that each department has its own unique needs. 
             Share with us your specific business needs, and we'll build a solution that is perfect for you.
           </p>
           
           <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
             <button
               onClick={onOpenContactForm}
               className="group bg-gradient-to-r from-orange-600 to-orange-700 text-white px-12 py-6 rounded-2xl font-semibold text-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3 shadow-lg"
             >
               Request a demo
               <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
             </button>
             
             <button
               onClick={onOpenLogin}
               className="text-gray-300 hover:text-white transition-colors font-medium text-lg flex items-center gap-3 group"
             >
               <span className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                 <span className="w-3 h-3 bg-gray-400 rounded-full group-hover:bg-white transition-colors"></span>
               </span>
               Sign in to your account
             </button>
           </div>
           
           {/* Trust indicators */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 pt-16 border-t border-gray-700">
             <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div>
               <div className="text-gray-400">Happy Customers</div>
             </div>
             <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
               <div className="text-gray-400">Support Available</div>
             </div>
             <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-white mb-2">99.9%</div>
               <div className="text-gray-400">Uptime Guarantee</div>
             </div>
           </div>
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