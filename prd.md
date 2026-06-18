> **⚠️ Documento reemplazado.** La planificación oficial del proyecto es **[PRD V2 — Radio Shalko 1.0](./prd-v2.md)**.  
> Este archivo se conserva solo como referencia histórica del alcance catálogo V1.

---

Radio Shalko Web

Product Requirements Document (V1 Actualizado)

⸻

Información General Del Proyecto

Nombre del Proyecto

Radio Shalko Web

Tipo de Proyecto

Catálogo Web Profesional + Panel Administrativo

Estado Actual

La interfaz visual inicial ya fue desarrollada parcialmente utilizando:

* Lovable￼
* Cursor￼

Actualmente el proyecto se encuentra en etapa de:

* optimización,
* arquitectura,
* estructuración,
* conexión backend,
* sistema administrativo,
* experiencia de usuario,
* seguridad,
* escalabilidad.

⸻

Objetivo General

Desarrollar una plataforma web moderna, profesional, elegante, minimalista y altamente funcional para la empresa Radio Shalko, enfocada en:

* exhibición profesional de productos,
* navegación optimizada,
* experiencia de usuario premium,
* catálogo inteligente,
* administración sencilla,
* escalabilidad futura.

La plataforma NO funcionará inicialmente como ecommerce completo.

La versión V1 se enfocará en:

* catálogo,
* cotización,
* favoritos,
* filtros,
* organización,
* panel administrativo,
* experiencia visual.

⸻

Objetivos Del Proyecto

Objetivos Principales

1. Crear una experiencia premium

Inspirada visualmente en:

* Apple￼
* Stripe￼
* Shopify￼
* Framer￼
* Arturia￼

⸻

2. Mejorar la experiencia de navegación

Facilitando:

* búsqueda,
* filtrado,
* organización,
* descubrimiento de productos.

⸻

3. Facilitar la administración de productos

Mediante un panel administrativo moderno y visual.

⸻

4. Optimización Responsive

La plataforma debe estar optimizada para:

* móvil,
* tablet,
* desktop.

PRIORIDAD PRINCIPAL:

Experiencia móvil.

⸻

Alcance De La V1

Incluye

Página web pública

* Home
* Productos
* Marcas
* Servicios
* Contacto
* Favoritos
* Cotización
* Login Google
* Productos relacionados
* Buscador general

⸻

Panel Administrativo

* Gestión de productos
* Gestión de categorías
* Gestión de marcas
* Gestión de banners
* Gestión de servicios
* Edición de contenido

⸻

Backend

* Supabase
* Base de datos PostgreSQL
* Storage
* Auth
* Roles
* Policies

⸻

NO Incluye En La V1

Ecommerce completo

NO se implementará inicialmente:

* pagos,
* checkout,
* envíos,
* pasarelas,
* órdenes,
* compras en línea.

⸻

App móvil administrativa

Queda pausada temporalmente.

⸻

Sistema de inventario avanzado

Queda pausado temporalmente.

⸻

Traspasos

Queda pausado temporalmente.

⸻

Sistema offline SQLite

Queda pausado temporalmente.

⸻

Arquitectura Tecnológica

Frontend

Tecnologías

* Next.js￼
* TailwindCSS
* Framer Motion
* React
* TypeScript

⸻

Backend

Plataforma

* Supabase￼

Funciones

* PostgreSQL
* Authentication
* Storage
* Row Level Security
* APIs
* Roles

⸻

Hosting

Recomendado

* Vercel￼

⸻

Seguridad

Recomendado

* Cloudflare￼

⸻

Diseño Visual General

Identidad Visual

La interfaz debe sentirse:

* minimalista,
* elegante,
* moderna,
* limpia,
* profesional,
* visual,
* premium,
* fluida.

⸻

Principios Visuales

Priorizar:

* claridad visual,
* buena jerarquía,
* simplicidad,
* navegación rápida,
* consistencia visual.

⸻

Evitar:

* saturación,
* exceso de colores,
* exceso de animaciones,
* interfaces pesadas.

⸻

Roles Del Sistema

1. Usuario

Puede:

* navegar productos,
* buscar productos,
* filtrar productos,
* guardar favoritos,
* iniciar sesión con Google,
* agregar productos a cotización,
* visualizar servicios,
* visualizar marcas,
* contactar tiendas.

⸻

NO Puede:

* acceder al panel admin,
* editar productos,
* modificar contenido.

⸻

2. Administrador

Puede:

* acceder a /admin,
* crear productos,
* editar productos,
* eliminar productos,
* subir imágenes,
* gestionar banners,
* gestionar categorías,
* gestionar marcas,
* modificar contenido general.

⸻

Estructura De La Página Web

HEADER

Elementos

Esquina superior izquierda

* Logotipo / isotipo.

⸻

Parte superior central

Menú:

* Productos
* Marcas
* Servicios
* Contacto

⸻

Esquina superior derecha

* Buscador
* Favoritos
* Cotización
* Usuario/Login

⸻

HOME

1. HERO PRINCIPAL

Carrusel visual

Mostrar:

* Guitarras
* Teclados
* Baterías
* Bajos

⸻

Cada slide incluirá:

* título,
* subtítulo,
* botón CTA.

⸻

Animaciones

* transición suave,
* movimiento elegante,
* responsive,
* optimizado móvil.

⸻

2. INFORMACIÓN EMPRESA

Secciones

* Nuestra historia
* Nuestro compromiso
* Servicios

⸻

3. MARCAS PRINCIPALES

Carrusel infinito horizontal

Características:

* logos monocromáticos,
* animación infinita,
* pausa al hover/touch,
* diseño limpio.

⸻

4. CATEGORÍAS DESTACADAS

Mostrar categorías visuales:

* Guitarras
* Bajos
* Violines
* Ukuleles
* Baterías
* Teclados
* Mezcladoras
* Interfaces
* Amplificadores
* Bafles

⸻

Interacción

* hover zoom suave,
* navegación directa,
* responsive.

⸻

5. FOOTER

Contenido

* logotipo,
* slogan,
* categorías,
* contacto,
* dirección,
* WhatsApp,
* Facebook,
* términos,
* privacidad.

⸻

PRODUCTOS

Funcionalidades

Filtros

* categoría,
* marca,
* precio.

⸻

Ordenamiento

* precio menor-mayor,
* precio mayor-menor,
* A-Z,
* Z-A,
* recientes.

⸻

Visualización

* ajustar tamaño productos,
* número de productos,
* diseño responsive.

⸻

Productos Relacionados

Funcionamiento

Mostrar productos similares según categoría.

⸻

FAVORITOS

Requiere login Google.

Usuarios podrán:

* guardar productos,
* visualizar favoritos,
* eliminar favoritos.

⸻

COTIZACIÓN

Función

Sistema tipo carrito NO ecommerce.

Permite:

* agregar productos,
* visualizar cotización,
* solicitar información.

NO incluye:

* pagos,
* checkout,
* compras.

⸻

MARCAS

Funcionalidad

Visualizar:

* todas las marcas,
* orden alfabético,
* productos relacionados a cada marca.

⸻

SERVICIOS

Mostrar:

* técnico instrumentos,
* ingeniería audio,
* asesoría personalizada,
* pruebas,
* apartados,
* garantías.

⸻

CONTACTO

Mostrar:

* sucursal Chalco,
* sucursal Amecameca,
* mapas,
* horarios,
* teléfonos,
* WhatsApp.

⸻

PANEL ADMINISTRATIVO

Ruta

/admin

⸻

Secciones

1. Dashboard

Mostrar:

* número productos,
* categorías,
* actividad reciente.

⸻

2. Productos

Funciones

* crear,
* editar,
* eliminar,
* buscar,
* filtrar.

⸻

Cada producto incluye:

* imágenes,
* título,
* subtítulo,
* descripción,
* precio,
* categoría,
* marca,
* productos relacionados.

⸻

3. Categorías

Funciones

* crear categorías,
* editar categorías,
* organizar categorías.

⸻

4. Marcas

Funciones

* agregar marcas,
* logos,
* orden visual.

⸻

5. Banners/Home

Funciones

Editar:

* imágenes,
* subtítulos,
* botones,
* hero principal.

⸻

6. Servicios

Funciones

Editar:

* textos,
* descripciones,
* contenido visual.

⸻

Base De Datos (Inicial)

Tablas Principales

profiles
products
categories
brands
product_images
favorites
services
banners
related_products

⸻

Seguridad

Implementar

1. Roles protegidos

admin
user

⸻

2. Middleware

Protección:

/admin

⸻

3. Row Level Security (RLS)

Implementar en Supabase.

⸻

4. Variables privadas

Uso obligatorio:

.env.local

⸻

5. Cloudflare

Protección:

* ataques,
* bots,
* spam,
* cache,
* CDN.

⸻

SEO

Implementar

* metadata dinámica,
* OpenGraph,
* sitemap,
* robots,
* URLs limpias,
* optimización imágenes.

⸻

Rendimiento

Optimizar:

* imágenes,
* lazy loading,
* animaciones,
* cache,
* rendimiento móvil.

⸻

Accesibilidad

Implementar:

* navegación accesible,
* contraste adecuado,
* responsive real,
* tipografía clara.

⸻

Documentos Legales

Crear:

* Política de privacidad
* Términos y condiciones
* Política de cookies

⸻

Fases Del Proyecto

FASE 1

Optimización estructura Lovable.

⸻

FASE 2

Arquitectura backend Supabase.

⸻

FASE 3

Sistema auth + roles.

⸻

FASE 4

Panel administrativo.

⸻

FASE 5

Productos dinámicos.

⸻

FASE 6

Favoritos + cotización.

⸻

FASE 7

SEO + seguridad + optimización.

⸻

Objetivo Final

Construir una plataforma web moderna y profesional para Radio Shalko que combine:

* experiencia visual premium,
* navegación intuitiva,
* administración eficiente,
* arquitectura escalable,
* rendimiento optimizado,
* identidad sólida de marca,
* experiencia móvil de alto nivel.