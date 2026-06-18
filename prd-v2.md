# Radio Shalko 1.0 — PRD V2 (Product Requirements Document)

## Estado del documento

| Campo | Valor |
|-------|-------|
| **Versión** | 2.0 |
| **Estado** | Activo |
| **Objetivo** | Definir la visión, arquitectura, estructura, funcionalidades, seguridad y roadmap oficial de Radio Shalko 1.0 |

Este documento reemplaza cualquier planificación anterior que ya no refleje la dirección actual del proyecto (incluido `prd.md` V1).

---

## 1. Visión del proyecto

Radio Shalko es una tienda especializada en:

- Instrumentos musicales
- Audio profesional
- Accesorios musicales
- Servicio técnico
- Asesoría especializada

Con más de 40 años de trayectoria y dos sucursales físicas.

La página web debe convertirse en:

- Catálogo profesional
- Ecommerce seguro
- Plataforma de confianza
- Herramienta administrativa para la empresa

**No debe sentirse como:**

- Marketplace genérico
- Shopify genérico
- Plantilla
- Página creada por IA

**Debe sentirse:**

- Profesional
- Premium
- Limpia
- Moderna
- Funcional
- Confiable
- Humana

---

## 2. Objetivos de Radio Shalko 1.0

### Objetivo principal

Permitir que cualquier usuario:

- Descubra productos
- Compare opciones
- Obtenga información real
- Compre en línea
- Reciba envíos
- Confíe en la marca

### Objetivos secundarios

- Mostrar experiencia de la empresa
- Mostrar servicios técnicos
- Posicionar la marca
- Facilitar administración de inventario
- Reducir dependencia de terceros

---

## 3. Roles del sistema

### Usuario

**Puede:**

- Ver catálogo
- Buscar productos
- Filtrar productos
- Ver ficha de producto
- Crear cuenta
- Iniciar sesión
- Guardar favoritos
- Agregar al carrito
- Comprar
- Consultar pedidos
- Actualizar dirección

**No puede:**

- Modificar productos
- Acceder al panel administrador
- Gestionar inventario

### Administrador

**Puede:**

- Crear productos
- Editar productos
- Eliminar productos
- Gestionar categorías
- Gestionar marcas
- Gestionar imágenes
- Gestionar pedidos
- Gestionar banners
- Gestionar servicios
- Gestionar inventario
- Gestionar usuarios (según permisos)

---

## 4. Estructura general del sitio

### Home

Se conserva la estructura actual.

**Mejoras futuras:**

- Fotografía profesional
- Banners dinámicos
- Productos reales
- Optimización móvil

### Catálogo

**Ruta:** `/productos`

**Funciones:**

- Búsqueda
- Filtros
- Ordenamiento
- Categorías
- Marcas
- Productos destacados

### Producto

**Ruta:** `/productos/[slug]`

**Contenido:**

- Galería
- Precio
- Marca
- Categoría
- Descripción
- Especificaciones
- Disponibilidad
- Productos relacionados
- Favoritos
- Agregar al carrito

### Marcas

**Ruta:** `/marcas`

**Funciones:**

- Ver marcas
- Productos por marca

### Servicios

**Ruta:** `/servicios`

**Funciones:**

- Servicio técnico
- Reparaciones
- Garantías
- Asesoría

### Contacto

**Ruta:** `/contacto`

**Funciones:**

- Información de sucursales
- WhatsApp
- Correo
- Formulario

### Cuenta

**Ruta:** `/cuenta`

**Funciones:**

- Perfil
- Direcciones
- Pedidos
- Favoritos

### Favoritos

**Ruta:** `/favoritos`

**Funciones:**

- Guardar productos
- Eliminar productos
- Agregar al carrito

### Carrito

**Ruta:** `/carrito`

**Funciones:**

- Modificar cantidades
- Eliminar productos
- Calcular subtotal
- Continuar a checkout

### Checkout

**Ruta:** `/checkout`

**Funciones:**

- Datos de envío
- Dirección
- Método de envío
- Método de pago
- Resumen

---

## 5. Panel administrador

**Ruta:** `/admin`

### Dashboard

- Ventas
- Pedidos
- Productos
- Stock

### Productos

Crear · Editar · Eliminar · Duplicar · Destacar

**Campos:**

| Campo |
|-------|
| Nombre |
| Slug |
| SKU |
| Marca |
| Categoría |
| Subcategoría |
| Descripción corta |
| Descripción larga |
| Precio |
| Precio anterior |
| Stock |
| Estado |
| Destacado |
| Nuevo |

### Imágenes

- Imagen principal
- Galería
- Reordenar
- Eliminar

### Categorías

Crear · Editar · Eliminar · Ordenar

### Marcas

Crear · Editar · Eliminar · Subir logo

### Pedidos

- Ver pedidos
- Actualizar estado
- Generar seguimiento

---

## 6. Base de datos

**Tablas principales:**

| Tabla | Propósito |
|-------|-----------|
| `users` | Auth (Supabase) |
| `profiles` | Perfil y rol |
| `products` | Catálogo |
| `product_images` | Galería |
| `categories` | Jerarquía de categorías |
| `brands` | Marcas |
| `favorites` | Favoritos por usuario |
| `carts` | Carritos |
| `cart_items` | Líneas de carrito |
| `orders` | Pedidos |
| `order_items` | Líneas de pedido |
| `payments` | Pagos |
| `shipments` | Envíos |

> **Nota técnica:** el esquema actual en `supabase/migrations/` cubre parcialmente este modelo. Faltan tablas de carrito, pedidos, pagos, envíos, stock y subcategorías jerárquicas. Ver Fase 1 del roadmap.

---

## 7. Autenticación

**Métodos:**

- Google
- Correo y contraseña (opcional)

**Administrador:**

- Roles protegidos
- Verificación mediante Supabase
- Acceso restringido

---

## 8. Pagos

**Versión 1.0 — evaluar:**

- Mercado Pago
- Stripe

**Objetivo:**

- Pago seguro
- Confirmación automática
- Actualización automática de pedidos

---

## 9. Envíos

**Versión 1.0 — opciones:**

- Recoger en tienda
- Envío local
- Envío nacional

**Evaluar integración con:**

- DHL
- Estafeta
- FedEx

---

## 10. Seguridad

**Requisitos obligatorios:**

- HTTPS
- RLS en Supabase
- Protección de roles
- Protección de rutas admin
- Validación de formularios
- Protección contra spam
- Protección de pagos
- Logs de actividad

---

## 11. Responsive

**Prioridad máxima:** móvil  
**Después:** tablet  
**Después:** desktop

Toda funcionalidad debe diseñarse primero para móvil.

---

## 12. Principios de diseño

**Debe sentirse como:**

- Fender
- Gibson
- Arturia
- Apple
- Herman Miller

**No debe sentirse como:**

- Mercado Libre
- Shopify genérico
- Dashboard SaaS
- Plantilla IA

**Principios:**

- Menos elementos
- Más claridad
- Más fotografía real
- Mejor jerarquía
- Mejor tipografía
- Mejor contenido

---

## 13. Roadmap oficial

| Fase | Entregable |
|------|------------|
| **0** | Auditoría y limpieza |
| **1** | Arquitectura y base de datos |
| **2** | Autenticación y roles |
| **3** | Panel administrador |
| **4** | CRUD de productos |
| **5** | Catálogo conectado a Supabase |
| **6** | Página de producto |
| **7** | Favoritos reales |
| **8** | Carrito |
| **9** | Checkout |
| **10** | Pagos |
| **11** | Envíos |
| **12** | Optimización visual |
| **13** | Pruebas |
| **14** | Lanzamiento |

---

## 14. Regla del proyecto

1. No agregar nuevas funciones fuera del roadmap.
2. No modificar estructura sin actualizar este documento.
3. Toda decisión debe responder: **¿Acerca Radio Shalko a la versión 1.0 o solo agrega complejidad?**

---

## Anexo: brecha respecto al código actual (mayo 2026)

Referencia de auditoría técnica. Estado al momento de activar este PRD:

| Área PRD V2 | Estado actual |
|-------------|---------------|
| Home, catálogo, marcas, servicios, contacto | UI avanzada; datos mock |
| `/productos/[slug]` | No existe |
| `/cuenta`, `/carrito`, `/checkout` | No existen |
| Favoritos persistentes | Solo localStorage |
| Admin CRUD | Placeholders |
| Supabase | Schema parcial; app no consulta DB |
| Pagos / envíos / pedidos | No implementados |
| Auth Google | Callback existe; sin UI de login |
| Protección admin por rol | No implementada |

**Próximo paso según roadmap:** Fase 0 → Fase 1 (extender schema + inventario real).
