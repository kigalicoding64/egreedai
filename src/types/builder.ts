export type ComponentType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'button'
  | 'container'
  | 'form'
  | 'input'
  | 'navbar'
  | 'hero'
  | 'footer'
  | 'card'
  | 'grid'
  | 'divider'
  | 'spacer'
  | 'video'
  | 'list'
  | 'testimonial'
  | 'pricing'
  | 'faq'
  | 'cta';

export interface BuilderComponent {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  children?: BuilderComponent[];
  styles?: Record<string, string>;
}

export interface BuilderPage {
  id: string;
  name: string;
  components: BuilderComponent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BuilderTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'landing' | 'portfolio' | 'blog' | 'ecommerce' | 'saas' | 'agency';
  components: BuilderComponent[];
}

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  icon: string;
  category: 'basic' | 'layout' | 'media' | 'sections' | 'advanced';
  defaultProps: Record<string, any>;
  defaultStyles?: Record<string, string>;
}

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // Basic
  { type: 'heading', label: 'Heading', icon: 'Type', category: 'basic', defaultProps: { text: 'Heading', level: 'h2' } },
  { type: 'paragraph', label: 'Paragraph', icon: 'AlignLeft', category: 'basic', defaultProps: { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' } },
  { type: 'button', label: 'Button', icon: 'Square', category: 'basic', defaultProps: { text: 'Click Me', variant: 'primary', href: '#' } },
  { type: 'image', label: 'Image', icon: 'Image', category: 'media', defaultProps: { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', alt: 'Placeholder' } },
  { type: 'video', label: 'Video', icon: 'Video', category: 'media', defaultProps: { src: '', placeholder: 'Enter video URL' } },
  { type: 'divider', label: 'Divider', icon: 'Minus', category: 'basic', defaultProps: {} },
  { type: 'spacer', label: 'Spacer', icon: 'MoveVertical', category: 'basic', defaultProps: { height: '40px' } },
  { type: 'list', label: 'List', icon: 'List', category: 'basic', defaultProps: { items: ['Item 1', 'Item 2', 'Item 3'], ordered: false } },
  { type: 'input', label: 'Input', icon: 'TextCursorInput', category: 'basic', defaultProps: { placeholder: 'Enter text...', label: 'Label', type: 'text' } },

  // Layout
  { type: 'container', label: 'Container', icon: 'Layout', category: 'layout', defaultProps: { maxWidth: '1200px' }, defaultStyles: { padding: '20px' } },
  { type: 'grid', label: 'Grid', icon: 'Grid3x3', category: 'layout', defaultProps: { columns: 3, gap: '20px' } },
  { type: 'card', label: 'Card', icon: 'CreditCard', category: 'layout', defaultProps: { title: 'Card Title', description: 'Card description goes here.' } },
  { type: 'form', label: 'Form', icon: 'FileInput', category: 'layout', defaultProps: { action: '#', method: 'POST' } },

  // Sections
  { type: 'navbar', label: 'Navbar', icon: 'Menu', category: 'sections', defaultProps: { brand: 'MyBrand', links: ['Home', 'About', 'Services', 'Contact'] } },
  { type: 'hero', label: 'Hero Section', icon: 'Sparkles', category: 'sections', defaultProps: { title: 'Build Something Amazing', subtitle: 'Create beautiful websites without writing a single line of code.', ctaText: 'Get Started', bgImage: '' } },
  { type: 'footer', label: 'Footer', icon: 'PanelBottom', category: 'sections', defaultProps: { brand: 'MyBrand', links: ['Privacy', 'Terms', 'Contact'], copyright: '© 2026 MyBrand. All rights reserved.' } },
  { type: 'testimonial', label: 'Testimonial', icon: 'Quote', category: 'sections', defaultProps: { quote: 'This product changed my life!', author: 'John Doe', role: 'CEO, Company', avatar: '' } },
  { type: 'pricing', label: 'Pricing', icon: 'DollarSign', category: 'sections', defaultProps: { plans: [{ name: 'Basic', price: '$9', features: ['Feature 1', 'Feature 2'] }, { name: 'Pro', price: '$29', features: ['Everything in Basic', 'Feature 3', 'Feature 4'] }, { name: 'Enterprise', price: '$99', features: ['Everything in Pro', 'Feature 5', 'Priority Support'] }] } },
  { type: 'faq', label: 'FAQ', icon: 'HelpCircle', category: 'sections', defaultProps: { items: [{ question: 'What is this?', answer: 'A no-code builder.' }, { question: 'How does it work?', answer: 'Drag and drop components to build your page.' }] } },
  { type: 'cta', label: 'Call to Action', icon: 'Megaphone', category: 'sections', defaultProps: { title: 'Ready to get started?', subtitle: 'Join thousands of happy users today.', buttonText: 'Sign Up Now', buttonHref: '#' } },
];
