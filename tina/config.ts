import { defineConfig } from 'tinacms'
import { BlogPostTag } from '~/data'

export default defineConfig({
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    accept: ['image/*'],
    tina: {
      mediaRoot: '',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      {
        name: 'blogs',
        label: 'Blog / Posts',
        path: 'content/blogs',
        ui: {
          filename: {
            readonly: false,
            slugify: (values: Record<string, any>) => `${values?.title?.toLowerCase().replace(/ /g, '-')}`,
          },
          beforeSubmit: async ({ form, values }) => {
            if (form.crudType === 'create') {
              return {
                ...values,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
              }
            }
            else {
              return {
                ...values,
                lastUpdated: new Date().toISOString(),
              }
            }
          },
        },
        fields: [
          {
            type: 'string',
            name: 'title',
            label: 'Title',
            isTitle: true,
            required: true,
            description: 'The title of the blog post',
          },
          {
            type: 'string',
            name: 'description',
            label: 'Description',
            required: true,
            description: 'The description of the blog post',
          },
          {
            type: 'image',
            name: 'image',
            label: 'Cover',
            required: true,
            description: 'The cover of the blog post',
          },
          {
            type: 'image',
            name: 'ogImage',
            label: 'OpenGraph image',
            required: true,
            description: 'The OpenGraph image of the blog post',
          },
          {
            type: 'string',
            name: 'tags',
            label: 'Tags',
            required: true,
            list: true,
            options: BlogPostTag.map(i => ({ value: i, label: `#${i}` })),
            description: 'The tags of the blog post',
          },
          {
            type: 'boolean',
            name: 'published',
            label: 'Is published',
            description: 'The published status of the blog post',
          },
          {
            type: 'boolean',
            name: 'trending',
            label: 'Is trendings',
            description: 'The trending status of the blog post',
          },
          {
            type: 'rich-text',
            name: 'body',
            label: 'Body',
            isBody: true,
          },
          {
            type: 'datetime',
            name: 'createdAt',
            label: 'Created At',
            description: 'The created at of the page',
          },
          {
            type: 'datetime',
            name: 'lastUpdated',
            label: 'Last Updated At',
            description: 'The created at of the page',
          },
        ],
      },
      {
        label: 'Documents',
        name: 'docs',
        path: 'content/docs',
        ui: {
          filename: {
            readonly: false,
            slugify: (values: Record<string, any>) => `${values?.title?.toLowerCase().replace(/ /g, '-')}`,
          },
          beforeSubmit: async ({ form, values }) => {
            if (form.crudType === 'create') {
              return {
                ...values,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
              }
            }
            else {
              return {
                ...values,
                lastUpdated: new Date().toISOString(),
              }
            }
          },
        },
        fields: [
          {
            type: 'string',
            name: 'title',
            label: 'Title',
            isTitle: true,
            required: true,
            description: 'The title of the page',
          },
          {
            type: 'rich-text',
            name: 'body',
            label: 'Body',
            isBody: true,
          },
          {
            type: 'datetime',
            name: 'createdAt',
            label: 'Created At',
            description: 'The created at of the page',
          },
          {
            type: 'datetime',
            name: 'lastUpdated',
            label: 'Last Updated At',
            description: 'The created at of the page',
          },
        ],
      },
      {
        label: 'Pages',
        name: 'pages',
        path: 'content/pages',
        ui: {
          filename: {
            readonly: false,
            slugify: (values: Record<string, any>) => `${values?.title?.toLowerCase().replace(/ /g, '-')}`,
          },
          beforeSubmit: async ({ form, values }) => {
            if (form.crudType === 'create') {
              return {
                ...values,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
              }
            }
            else {
              return {
                ...values,
                lastUpdated: new Date().toISOString(),
              }
            }
          },
        },
        fields: [
          {
            type: 'string',
            name: 'title',
            label: 'Title',
            isTitle: true,
            required: true,
            description: 'The title of the page',
          },
          {
            type: 'rich-text',
            name: 'body',
            label: 'Body',
            isBody: true,
          },
          {
            type: 'datetime',
            name: 'createdAt',
            label: 'Created At',
            description: 'The created at of the page',
          },
          {
            type: 'datetime',
            name: 'lastUpdated',
            label: 'Last Updated At',
            description: 'The created at of the page',
          },
        ],
      },
    ],
  },
})
