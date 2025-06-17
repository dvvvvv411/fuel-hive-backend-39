
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, CreditCard, FileText, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Heating Oil Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete multi-shop heating oil backend system with order management, 
            payment processing, and administrative dashboard.
          </p>
          <div className="space-x-4">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Store className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Multi-Shop Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage multiple heating oil shops from a single dashboard
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Order Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Streamlined order management with automated workflows
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CreditCard className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Payment Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure bank account management and payment processing
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <CardTitle>Secure & Reliable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built with security and reliability at its core
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Ready to manage your heating oil business?
          </h2>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Access Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
