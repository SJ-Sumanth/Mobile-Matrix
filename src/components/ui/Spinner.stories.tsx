import type { Meta, StoryObj } from '@storybook/react'
import { Spinner, LoadingSpinner } from './Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'white', 'current'],
    },
    thickness: {
      control: { type: 'select' },
      options: ['thin', 'medium', 'thick'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Primary: Story = {
  args: {
    color: 'primary',
  },
}

export const White: Story = {
  args: {
    color: 'white',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <Spinner size="sm" />
        <p className="text-xs text-foreground/70 mt-2">Small</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="text-xs text-foreground/70 mt-2">Medium</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-xs text-foreground/70 mt-2">Large</p>
      </div>
      <div className="text-center">
        <Spinner size="xl" />
        <p className="text-xs text-foreground/70 mt-2">Extra Large</p>
      </div>
    </div>
  ),
}

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <Spinner color="primary" />
        <p className="text-xs text-foreground/70 mt-2">Primary</p>
      </div>
      <div className="text-center">
        <Spinner color="secondary" />
        <p className="text-xs text-foreground/70 mt-2">Secondary</p>
      </div>
      <div className="text-center bg-black p-4 rounded">
        <Spinner color="white" />
        <p className="text-xs text-white/70 mt-2">White</p>
      </div>
      <div className="text-center text-primary">
        <Spinner color="current" />
        <p className="text-xs text-foreground/70 mt-2">Current</p>
      </div>
    </div>
  ),
}

export const Thickness: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <Spinner thickness="thin" />
        <p className="text-xs text-foreground/70 mt-2">Thin</p>
      </div>
      <div className="text-center">
        <Spinner thickness="medium" />
        <p className="text-xs text-foreground/70 mt-2">Medium</p>
      </div>
      <div className="text-center">
        <Spinner thickness="thick" />
        <p className="text-xs text-foreground/70 mt-2">Thick</p>
      </div>
    </div>
  ),
}

export const LoadingSpinnerComponent: Story = {
  render: () => (
    <div className="space-y-8">
      <LoadingSpinner text="Loading phones..." />
      <LoadingSpinner size="lg" text="Comparing specifications..." />
      <LoadingSpinner size="sm" text="Saving comparison..." />
    </div>
  ),
}

export const InlineUsage: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <span className="text-foreground/70">Loading phone data...</span>
      </div>
      
      <div className="p-4 bg-secondary/30 rounded-lg">
        <div className="flex items-center justify-center gap-3">
          <Spinner />
          <span>Fetching comparison results...</span>
        </div>
      </div>
      
      <div className="border border-border rounded-lg p-6">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <h3 className="font-semibold mb-2">Processing Your Request</h3>
          <p className="text-foreground/70">This may take a few moments...</p>
        </div>
      </div>
    </div>
  ),
}

export const ButtonWithSpinner: Story = {
  render: () => (
    <div className="space-y-4">
      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg">
        <Spinner size="sm" color="white" />
        Loading...
      </button>
      
      <button className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border text-foreground rounded-lg">
        <Spinner size="sm" />
        Comparing phones...
      </button>
      
      <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-lg">
        <Spinner size="md" color="white" />
        Processing comparison...
      </button>
    </div>
  ),
}