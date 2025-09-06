import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'
import { Button } from './Button'
import { Input } from './Input'

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    closeOnOverlayClick: {
      control: { type: 'boolean' },
    },
    closeOnEscape: {
      control: { type: 'boolean' },
    },
    showCloseButton: {
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const ModalWrapper = ({ children, ...args }: any) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </Modal>
    </>
  )
}

export const Default: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <p>This is a basic modal with default settings.</p>
    </ModalWrapper>
  ),
}

export const WithTitleAndDescription: Story = {
  render: (args) => (
    <ModalWrapper {...args} title="Phone Comparison" description="Compare specifications between two phones">
      <p>This modal has a title and description in the header.</p>
    </ModalWrapper>
  ),
}

export const LargeModal: Story = {
  render: (args) => (
    <ModalWrapper {...args} size="lg" title="Large Modal" description="This is a larger modal for more content">
      <div className="space-y-4">
        <p>This is a large modal that can contain more content.</p>
        <p>You can use this for detailed forms, comparisons, or other complex content.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-secondary/30 rounded">
            <h4 className="font-semibold mb-2">Phone 1</h4>
            <p className="text-sm text-foreground/70">iPhone 15 Pro</p>
          </div>
          <div className="p-4 bg-secondary/30 rounded">
            <h4 className="font-semibold mb-2">Phone 2</h4>
            <p className="text-sm text-foreground/70">Samsung Galaxy S24</p>
          </div>
        </div>
      </div>
    </ModalWrapper>
  ),
}

export const FormModal: Story = {
  render: (args) => (
    <ModalWrapper {...args} title="Add Phone for Comparison" description="Enter phone details to add to comparison">
      <ModalBody>
        <div className="space-y-4">
          <Input
            label="Phone Brand"
            placeholder="e.g., Apple, Samsung, OnePlus"
          />
          <Input
            label="Phone Model"
            placeholder="e.g., iPhone 15 Pro, Galaxy S24"
          />
          <Input
            label="Storage Variant"
            placeholder="e.g., 128GB, 256GB"
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">Add Phone</Button>
      </ModalFooter>
    </ModalWrapper>
  ),
}

export const ConfirmationModal: Story = {
  render: (args) => (
    <ModalWrapper 
      {...args} 
      size="sm" 
      title="Delete Comparison" 
      description="Are you sure you want to delete this phone comparison?"
    >
      <ModalBody>
        <p className="text-foreground/70">This action cannot be undone. The comparison data will be permanently removed.</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="danger">Delete</Button>
      </ModalFooter>
    </ModalWrapper>
  ),
}

export const PhoneComparisonModal: Story = {
  render: (args) => (
    <ModalWrapper 
      {...args} 
      size="xl" 
      title="Phone Comparison Results" 
      description="Detailed comparison between selected phones"
    >
      <ModalBody>
        <div className="grid grid-cols-2 gap-6">
          {/* Phone 1 */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v16H7V4z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg">iPhone 15 Pro</h3>
              <p className="text-primary font-semibold">₹1,34,900</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-foreground/70">Display</span>
                <span className="text-sm">6.1" Super Retina XDR</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-foreground/70">Processor</span>
                <span className="text-sm">A17 Pro</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-foreground/70">RAM</span>
                <span className="text-sm">8GB</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-foreground/70">Storage</span>
                <span className="text-sm">128GB</span>
              </div>
            </div>
          </div>

          {/* Phone 2 */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v16H7V4z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Galaxy S24 Ultra</h3>
              <p className="text-primary font-semibold">₹1,29,999</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-foreground/70">Display</span>
                <span className="text-sm">6.8" Dynamic AMOLED</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-foreground/70">Processor</span>
                <span className="text-sm">Snapdragon 8 Gen 3</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-foreground/70">RAM</span>
                <span className="text-sm">12GB</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/30">
                <span className="text-foreground/70">Storage</span>
                <span className="text-sm">256GB</span>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline">Share Comparison</Button>
        <Button variant="primary">Save Comparison</Button>
      </ModalFooter>
    </ModalWrapper>
  ),
}

export const NoCloseButton: Story = {
  render: (args) => (
    <ModalWrapper {...args} showCloseButton={false} title="Important Notice">
      <ModalBody>
        <p>This modal doesn't have a close button. You must use the action buttons below.</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary">I Understand</Button>
      </ModalFooter>
    </ModalWrapper>
  ),
}