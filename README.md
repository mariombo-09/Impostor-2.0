# Impostor - Juego de Palabras Multijugador

Un juego de deduccion social donde los civiles deben descubrir al impostor entre ellos. Todos los civiles reciben la misma palabra secreta, mientras que el impostor recibe una pista relacionada pero diferente.

## Como Jugar

### Reglas del Juego
1. **Civiles**: Reciben todos la misma palabra secreta
2. **Impostor**: Recibe una pista relacionada (pero no la palabra exacta)
3. **Turnos**: Cada jugador da una pista sobre su palabra sin decirla directamente
4. **Votacion**: Al final, todos votan quien creen que es el impostor
5. **Victoria**: Los civiles ganan si descubren al impostor; el impostor gana si no es descubierto

### Modos de Juego

#### Modo Clasico (Un dispositivo)
- Perfecto para jugar en persona
- Pasa el dispositivo entre jugadores
- Cada jugador ve su palabra en secreto

#### Modo Multijugador (WebSocket)
- Cada jugador usa su propio dispositivo
- Crea una sala con codigo unico
- Juega de forma remota con amigos

## Categorias Disponibles

- **Animales** - 55 palabras con pistas creativas
- **Peliculas** - Referencias cinematograficas rebuscadas
- **Objetos** - Objetos cotidianos con pistas ingeniosas
- **Deportes** - Deportes y referencias deportivas
- **Comida** - Gastronomia con toques culturales
- **Tecnologia** - Tech con referencias geek
- **General** - Lugares y situaciones variadas

## Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + WebSocket
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: TanStack Query

## Instalacion

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/impostor-game.git
cd impostor-game

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev
```

## Scripts Disponibles

```bash
npm run dev      # Inicia servidor de desarrollo
npm run build    # Compila para produccion
npm run start    # Inicia servidor de produccion
```

## Estructura del Proyecto

```
├── client/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Paginas de la aplicacion
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilidades
├── server/
│   ├── routes.ts          # API endpoints + WebSocket
│   ├── storage.ts         # Capa de datos
│   └── index.ts           # Punto de entrada
├── shared/
│   └── schema.ts          # Tipos compartidos + palabras
└── package.json
```

## Configuracion

El juego funciona sin configuracion adicional. Para produccion:

1. Configura las variables de entorno necesarias
2. Ejecuta `npm run build`
3. Despliega en tu plataforma preferida

## Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agrega nueva caracteristica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## Licencia

MIT License - Libre para uso personal y comercial.
