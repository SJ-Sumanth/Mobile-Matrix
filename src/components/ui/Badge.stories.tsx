import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'outline'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    rounded: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default Badge',
  },
}

export const Primary: Story = {
  args: {
    children: 'Primary',
    variant: 'primary',
  },
}

export const Success: Story = {
  args: {
    children: 'Available',
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Limited Stock',
    variant: 'warning',
  },
}

export const Error: Story = {
  args: {
    children: 'Out of Stock',
    variant: 'error',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

export const Rounded: Story = {
  args: {
    children: 'Rounded',
    variant: 'primary',
    rounded: true,
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm" variant="primary">Small</Badge>
      <Badge size="md" variant="primary">Medium</Badge>
      <Badge size="lg" variant="primary">Large</Badge>
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
}

export const PhoneStatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-foreground/70">iPhone 15 Pro</span>
        <Badge variant="success" size="sm">Available</Badge>
        <Badge variant="primary" size="sm" rounded>New</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-foreground/70">Galaxy S23</span>
        <Badge variant="warning" size="sm">Limited Stock</Badge>
        <Badge variant="outline" size="sm">₹10,000 Off</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-foreground/70">Pixel 7</span>
        <Badge variant="error" size="sm">Out of Stock</Badge>
        <Badge variant="secondary" size="sm">Discontinued</Badge>
      </div>
    </div>
  ),
}

export const ComparisonBadges: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
      <h3 className="font-semibold text-foreground mb-4">Phone Comparison Results</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Display Quality</span>
          <div className="flex gap-2">
            <Badge variant="success" size="sm">iPhone 15 Pro</Badge>
            <Badge variant="outline" size="sm">Galaxy S24</Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Performance</span>
          <div className="flex gap-2">
            <Badge variant="success" size="sm">iPhone 15 Pro</Badge>
            <Badge variant="outline" size="sm">Galaxy S24</Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Camera</span>
          <div className="flex gap-2">
            <Badge variant="outline" size="sm">iPhone 15 Pro</Badge>
            <Badge variant="success" size="sm">Galaxy S24</Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Battery Life</span>
          <div className="flex gap-2">
            <Badge variant="outline" size="sm">iPhone 15 Pro</Badge>
            <Badge variant="success" size="sm">Galaxy S24</Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Value for Money</span>
          <div className="flex gap-2">
            <Badge variant="outline" size="sm">iPhone 15 Pro</Badge>
            <Badge variant="success" size="sm">Galaxy S24</Badge>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border/30">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Overall Winner</span>
          <Badge variant="primary" size="lg" rounded>Galaxy S24</Badge>
        </div>
      </div>
    </div>
  ),
}