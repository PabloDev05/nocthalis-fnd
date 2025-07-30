import { JSX } from "react";
import { FaSpider } from "react-icons/fa";
import { GiBowArrow } from "react-icons/gi";
import {
  Shield,
  Sword,
  Flame,
  Snowflake,
  Ghost,
  Zap,
  Target,
} from "lucide-react";

export interface Passive {
  name: string;
  description: string;
  detail?: string;
}

export interface Subclass {
  name: string;
  icon: JSX.Element;
  passives: Passive[];
}

export interface GameClass {
  name: string;
  icon: JSX.Element;
  passiveDefault: Passive;
  subclasses: Subclass[];
}

export const classes: GameClass[] = [
  {
    name: "Guerrero",
    icon: <Shield className="text-red-500" />,
    passiveDefault: {
      name: "Espíritu de Guardia",
      description: "Reduce el daño recibido mientras el escudo está activo.",
    },
    subclasses: [
      {
        name: "Paladín Caído (Escudo)",
        icon: <Shield className="text-slate-300" />,
        passives: [
          {
            name: "Defensa Absoluta",
            description:
              "Incrementa la defensa física cuando se encuentra por debajo del 50% de vida.",
          },
          {
            name: "Aura Sagrada",
            description: "Regenera vida lentamente a aliados cercanos.",
          },
          {
            name: "Escudo de Luz",
            description: "Reduce daño mágico recibido.",
          },
          {
            name: "Guardia Implacable",
            description: "Reduce duración de aturdimientos.",
          },
          {
            name: "Fortaleza del Espíritu",
            description: "Incrementa resistencia a efectos de control.",
          },
          {
            name: "Bendición de Coraje",
            description:
              "Incrementa la moral y fuerza de ataque a aliados cercanos.",
          },
          {
            name: "Rebote de Escudo",
            description: "Chance de reflejar parte del daño recibido.",
          },
          {
            name: "Resistencia Inquebrantable",
            description: "Reduce daño crítico recibido.",
          },
        ],
      },
      {
        name: "Verdugo de Hierro (Espada Dos Manos)",
        icon: <Sword className="text-red-600" />,
        passives: [
          {
            name: "Ira Desatada",
            description: "+15% daño con espada de dos manos.",
          },
          {
            name: "Carga Brutal",
            description: "Primer golpe tras moverse hace más daño.",
          },
          {
            name: "Golpe Sísmico",
            description: "Chance de aturdir con ataques pesados.",
          },
          {
            name: "Furia Incontenible",
            description:
              "Aumenta la velocidad de ataque cuando está en combate.",
          },
          {
            name: "Maestría en Espada",
            description: "Incrementa daño crítico con espadas.",
          },
          {
            name: "Sangre de Batalla",
            description: "Restaura vida proporcional al daño infligido.",
          },
          {
            name: "Golpe Demoledor",
            description: "Rompe armadura enemiga.",
          },
          {
            name: "Corazón de Hierro",
            description: "Reduce daño recibido de ataques físicos.",
          },
        ],
      },
    ],
  },
  {
    name: "Mago",
    icon: <Flame className="text-purple-500" />,
    passiveDefault: {
      name: "Llama Interna",
      description: "Aumenta el daño de fuego con el tiempo.",
    },
    subclasses: [
      {
        name: "Hechicero de Fuego",
        icon: <Flame className="text-orange-500" />,
        passives: [
          {
            name: "Ignición",
            description: "Provoca explosión al acumular quemaduras.",
          },
          {
            name: "Llama Perpetua",
            description: "Daño de fuego aumenta con el tiempo.",
          },
          {
            name: "Fuego Interior",
            description: "Regenera maná mientras está en combate.",
          },
          {
            name: "Pirotecnia",
            description: "Aumenta radio de área de los hechizos.",
          },
          {
            name: "Chispa Divina",
            description: "Chance de lanzar una llamarada extra.",
          },
          {
            name: "Corazón Ardiente",
            description: "Resiste el daño de fuego.",
          },
          {
            name: "Combustión",
            description: "Los enemigos afectados reciben daño extra.",
          },
          {
            name: "Espíritu Ígneo",
            description: "Incrementa daño crítico de fuego.",
          },
        ],
      },
      {
        name: "Sabio del Hielo",
        icon: <Snowflake className="text-blue-400" />,
        passives: [
          {
            name: "Viento Invernal",
            description: "Ralentiza enemigos con cada hechizo.",
          },
          {
            name: "Corazón Gélido",
            description: "Reduce daño recibido de enemigos congelados.",
          },
          {
            name: "Escudo de Hielo",
            description: "Absorbe daño por tiempo limitado.",
          },
          {
            name: "Aliento Glacial",
            description: "Chance de congelar enemigos.",
          },
          {
            name: "Frío Implacable",
            description: "Incrementa duración de ralentización.",
          },
          {
            name: "Espiral de Nieve",
            description: "Hechizos en área tienen efecto en cadena.",
          },
          {
            name: "Manto Ártico",
            description: "Incrementa defensa mágica.",
          },
          {
            name: "Pacto de Escarcha",
            description: "Regenera maná al infligir daño con hielo.",
          },
        ],
      },
    ],
  },
  {
    name: "Asesino",
    icon: <Ghost className="text-green-500" />,
    passiveDefault: {
      name: "Sombra Letal",
      description: "Aumenta el daño de ataques por la espalda.",
    },
    subclasses: [
      {
        name: "Acechador Nocturno",
        icon: <Ghost className="text-gray-400" />,
        passives: [
          {
            name: "Paso Silencioso",
            description: "Reduce la detección por enemigos.",
          },
          {
            name: "Golpe Mortal",
            description: "Crítico garantizado al salir de sigilo.",
          },
          {
            name: "Sombra Veloz",
            description: "Aumenta velocidad al estar en sigilo.",
          },
          {
            name: "Asesinato Preciso",
            description: "Daño extra si el enemigo está debilitado.",
          },
          {
            name: "Eco Fantasma",
            description: "Ataca rápido después de un golpe crítico.",
          },
          {
            name: "Huida Sombría",
            description: "Incrementa evasión tras salir de combate.",
          },
          {
            name: "Veneno Letal",
            description: "Aplica veneno que hace daño con el tiempo.",
          },
          {
            name: "Instinto Predador",
            description: "Incrementa daño crítico.",
          },
        ],
      },
      {
        name: "Danzarín de Sombras",
        icon: <Zap className="text-indigo-400" />,
        passives: [
          {
            name: "Reflejo Fantasmal",
            description: "Probabilidad de evadir ataques mientras se mueve.",
          },
          {
            name: "Danza Letal",
            description: "Aumenta daño mientras se mueve.",
          },
          {
            name: "Velocidad Espectral",
            description: "Incrementa movimiento tras esquivar.",
          },
          {
            name: "Espíritu Errante",
            description: "Chance de evitar control de masas.",
          },
          {
            name: "Desvanecimiento",
            description: "Regenera vida al evadir un ataque.",
          },
          {
            name: "Golpe Fantasma",
            description: "Daño extra al atacar desde atrás.",
          },
          {
            name: "Sombra Viva",
            description: "Reduce enfriamientos de habilidades.",
          },
          {
            name: "Espíritu Ágil",
            description:
              "Incrementa ataque crítico mientras está en movimiento.",
          },
        ],
      },
    ],
  },
  {
    name: "Arquero",
    icon: <GiBowArrow className="text-yellow-600" />,
    passiveDefault: {
      name: "Ojo del Águila",
      description: "Aumenta el daño y precisión con arcos.",
    },
    subclasses: [
      {
        name: "Tirador de Precisión",
        icon: <Target className="text-yellow-400" />,
        passives: [
          {
            name: "Disparo Concentrado",
            description: "Incrementa el daño crítico con arcos.",
          },
          {
            name: "Puntería Letal",
            description: "Aumenta el daño al impactar en puntos débiles.",
          },
          {
            name: "Respiración Controlada",
            description:
              "Reduce el retroceso y mejora la estabilidad del disparo.",
          },
          {
            name: "Silencio Mortal",
            description: "Los ataques no alertan a enemigos cercanos.",
          },
          {
            name: "Ojo de Águila",
            description: "Aumenta el rango efectivo del arco.",
          },
          {
            name: "Pulso Preciso",
            description: "Disparos cargados infligen daño crítico garantizado.",
          },
          {
            name: "Flecha Explosiva",
            description: "Chance de explosión que daña a enemigos cercanos.",
          },
          {
            name: "Reflejo Ágil",
            description: "Aumenta la velocidad de ataque tras esquivar.",
          },
        ],
      },
      {
        name: "Trampero de Bosque",
        icon: <FaSpider className="text-green-500" />,
        passives: [
          {
            name: "Trampa Maestra",
            description: "Incrementa daño y duración de trampas.",
          },
          {
            name: "Acecho Silencioso",
            description: "Aumenta el daño al atacar desde sigilo.",
          },
          {
            name: "Red de Lianas",
            description: "Las trampas ralentizan y enredan a los enemigos.",
          },
          {
            name: "Conocimiento Natural",
            description: "Mejora evasión en terrenos boscosos.",
          },
          {
            name: "Danza de la Araña",
            description: "Aumenta velocidad de ataque tras activar trampas.",
          },
          {
            name: "Precisión Letal",
            description: "Incrementa daño crítico al usar trampas.",
          },
          {
            name: "Sombra de la Selva",
            description: "Mejora evasión mientras está en terreno natural.",
          },
          {
            name: "Instinto de Cazador",
            description: "Incrementa daño crítico mientras está en sigilo.",
          },
        ],
      },
    ],
  },
];
