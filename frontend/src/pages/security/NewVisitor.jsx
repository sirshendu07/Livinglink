import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, User, Phone, Building, Home, Truck, Car } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import Button from '../../components/common/Button';
import { visitorApi } from '../../services/api/visitorApi';
import { VISITOR_CATEGORY } from '../../constants';

const newVisitorSchema = z.object({
  visitorName: z.string().min(2, 'Visitor name is required'),
  visitorPhone: z.string().min(10, 'Valid 10-digit phone number is required'),
  tower: z.string().min(1, 'Destination tower is required'),
  flatNumber: z.string().min(1, 'Destination flat is required'),
  category: z.string().min(1, 'Visitor category is required'),
  purpose: z.string().optional(),
  vehicleNumber: z.string().optional()
});

export const NewVisitor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(newVisitorSchema),
    defaultValues: {
      category: 'FOOD_DELIVERY',
      purpose: 'Delivery'
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await visitorApi.createRequest(data);
      toast.success(`Entry request sent to Flat ${data.tower}-${data.flatNumber}! Status: PENDING`);
      navigate('/security/approvals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit visitor request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border-muted">
        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/40 text-accent flex items-center justify-center">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Gate Visitor Registration</h2>
          <p className="text-xs text-text-secondary">Log arrivals and dispatch real-time approval requests to residents.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Visitor Full Name"
              placeholder="e.g. Rahul Verma"
              icon={User}
              error={errors.visitorName?.message}
              {...register('visitorName')}
            />

            <Input
              label="Visitor Phone Number"
              placeholder="+919876543210"
              icon={Phone}
              error={errors.visitorPhone?.message}
              {...register('visitorPhone')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Destination Tower"
              placeholder="e.g. Tower A"
              icon={Building}
              error={errors.tower?.message}
              {...register('tower')}
            />

            <Input
              label="Destination Flat Number"
              placeholder="e.g. 101"
              icon={Home}
              error={errors.flatNumber?.message}
              {...register('flatNumber')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Visitor Category"
              options={Object.keys(VISITOR_CATEGORY).map((cat) => ({
                value: cat,
                label: cat.replace('_', ' ')
              }))}
              error={errors.category?.message}
              {...register('category')}
            />

            <Input
              label="Vehicle Registration (Optional)"
              placeholder="e.g. MH 02 AB 1234"
              icon={Car}
              error={errors.vehicleNumber?.message}
              {...register('vehicleNumber')}
            />
          </div>

          <Input
            label="Purpose of Visit"
            placeholder="e.g. Swiggy food delivery parcel"
            error={errors.purpose?.message}
            {...register('purpose')}
          />

          <div className="pt-2">
            <Button type="submit" size="lg" loading={loading} className="w-full font-bold">
              Dispatch Request to Resident Flat
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewVisitor;
