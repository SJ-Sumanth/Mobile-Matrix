import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'
import { Button } from './Button'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined', 'glass'],
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
    hover: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    className: 'w-80',
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>This is a card description that explains what this card is about.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card. You can put any content here.</p>
        </CardContent>
        <CardFooter>
          <Button variant="primary">Action</Button>
          <Button variant="outline">Cancel</Button>
        </CardFooter>
      </>
    ),
  },
}

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    className: 'w-80',
    children: (
      <>
        <CardHeader>
          <CardTitle>Elevated Card</CardTitle>
          <CardDescription>This card has an elevated appearance with shadow.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Elevated cards are great for highlighting important content.</p>
        </CardContent>
      </>
    ),
  },
}

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    className: 'w-80',
    children: (
      <>
        <CardHeader>
          <CardTitle>Outlined Card</CardTitle>
          <CardDescription>This card has a prominent border.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Outlined cards work well for form sections or grouped content.</p>
        </CardContent>
      </>
    ),
  },
}

export const Glass: Story = {
  args: {
    variant: 'glass',
    className: 'w-80',
    children: (
      <>
        <CardHeader>
          <CardTitle>Glass Card</CardTitle>
          <CardDescription>This card has a glass morphism effect.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Glass cards create a modern, translucent appearance.</p>
        </CardContent>
      </>
    ),
  },
}

export const Hoverable: Story = {
  args: {
    hover: true,
    className: 'w-80',
    children: (
      <>
        <CardHeader>
          <CardTitle>Hoverable Card</CardTitle>
          <CardDescription>This card responds to hover interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Try hovering over this card to see the effect.</p>
        </CardContent>
      </>
    ),
  },
}

export const PhoneComparisonCard: Story = {
  render: () => (
    <Card variant="elevated" hover className="w-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v16H7V4z"/>
            </svg>
          </div>
          iPhone 15 Pro
        </CardTitle>
        <CardDescription>Latest flagship smartphone from Apple</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-foreground/70">Display:</span>
            <span>6.1" Super Retina XDR</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/70">Processor:</span>
            <span>A17 Pro</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/70">Storage:</span>
            <span>128GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/70">Price:</span>
            <span className="text-primary font-semibold">₹1,34,900</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="primary" className="flex-1">Compare</Button>
        <Button variant="outline">Details</Button>
      </CardFooter>
    </Card>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
      <Card variant="default" className="p-4">
        <h3 className="font-semibold mb-2">Default Card</h3>
        <p className="text-sm text-foreground/70">Standard card appearance</p>
      </Card>
      <Card variant="elevated" className="p-4">
        <h3 className="font-semibold mb-2">Elevated Card</h3>
        <p className="text-sm text-foreground/70">Card with shadow</p>
      </Card>
      <Card variant="outlined" className="p-4">
        <h3 className="font-semibold mb-2">Outlined Card</h3>
        <p className="text-sm text-foreground/70">Card with border</p>
      </Card>
      <Card variant="glass" className="p-4">
        <h3 className="font-semibold mb-2">Glass Card</h3>
        <p className="text-sm text-foreground/70">Translucent appearance</p>
      </Card>
    </div>
  ),
}