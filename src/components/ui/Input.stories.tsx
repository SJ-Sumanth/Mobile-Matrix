import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'filled', 'outlined'],
    },
    inputSize: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    error: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Phone Model',
    placeholder: 'e.g., iPhone 15 Pro',
    helperText: 'Enter the exact model name',
  },
}

export const WithError: Story = {
  args: {
    label: 'Phone Model',
    placeholder: 'e.g., iPhone 15 Pro',
    error: true,
    errorText: 'Phone model is required',
  },
}

export const WithIcons: Story = {
  args: {
    placeholder: 'Search phones...',
    leftIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    rightIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
    value: 'Disabled value',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input inputSize="sm" placeholder="Small input" label="Small" />
      <Input inputSize="md" placeholder="Medium input" label="Medium" />
      <Input inputSize="lg" placeholder="Large input" label="Large" />
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input variant="default" placeholder="Default variant" label="Default" />
      <Input variant="filled" placeholder="Filled variant" label="Filled" />
      <Input variant="outlined" placeholder="Outlined variant" label="Outlined" />
    </div>
  ),
}

export const PhoneSearchInput: Story = {
  render: () => (
    <div className="w-96">
      <Input
        label="Search Phones"
        placeholder="Type phone brand or model..."
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        helperText="Search from thousands of phone models available in India"
        variant="outlined"
        inputSize="lg"
      />
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-96 p-6 bg-secondary/30 rounded-lg">
      <h3 className="text-lg font-semibold text-foreground mb-4">Phone Comparison Form</h3>
      <Input
        label="First Phone"
        placeholder="e.g., iPhone 15 Pro"
        leftIcon={
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v16H7V4z"/>
          </svg>
        }
      />
      <Input
        label="Second Phone"
        placeholder="e.g., Samsung Galaxy S24"
        leftIcon={
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v16H7V4z"/>
          </svg>
        }
      />
      <Input
        label="Your Email (Optional)"
        type="email"
        placeholder="your@email.com"
        helperText="Get comparison results via email"
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
      />
    </div>
  ),
}