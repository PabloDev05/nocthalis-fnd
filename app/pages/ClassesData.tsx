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
              "Incrementa 15% la defensa física cuando se encuentra por debajo del 30% de vida.",
          },
          {
            name: "Resistencia Inquebrantable",
            description: "Reduce 15% el daño crítico recibido.",
          },
        ],
      },
      {
        name: "Verdugo de Hierro (Espada Dos Manos)",
        icon: <Sword className="text-red-600" />,
        passives: [
          {
            name: "Ira Desatada",
            description: "+15% daño físico con espada de dos manos.",
          },
          {
            name: "Carga Brutal",
            description:
              "Primer golpe tras moverse hace 15% más de daño físico.",
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
      description: "Aumenta el daño elemental con el tiempo.",
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
            name: "Chispa Divina",
            description: "Chance de lanzar una llamarada extra.",
          },
        ],
      },
      {
        name: "Sabio del Hielo",
        icon: <Snowflake className="text-blue-400" />,
        passives: [
          {
            name: "Aliento Glacial",
            description: "Chance de congelar enemigos.",
          },
          {
            name: "Reacción Glacial",
            description:
              "Al recibir un golpe crítico, se activa automáticamente un escudo de hielo que bloquea el siguiente ataque.",
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
      description: "30% de incremento en daño crítico.",
    },
    subclasses: [
      {
        name: "Acechador Nocturno",
        icon: <Ghost className="text-gray-400" />,
        passives: [
          {
            name: "Veneno Letal",
            description: "Aplica veneno que hace daño con el tiempo.",
          },
          {
            name: "Toxina Paralizante",
            description:
              "Los enemigos envenenados tienen una probabilidad de quedar inmovilizados brevemente.",
          },
        ],
      },
      {
        name: "Danzarín de Sombras",
        icon: <Zap className="text-indigo-400" />,
        passives: [
          {
            name: "Reflejo Fantasmal",
            description: "Probabilidad de evadir ataques.",
          },
          {
            name: "Contraataque Sombrío",
            description:
              "Tras evadir con éxito, tu próximo ataque es un golpe crítico garantizado.",
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
      description: "Aumenta el daño con el tiempo.",
    },
    subclasses: [
      {
        name: "Tirador de Precisión",
        icon: <Target className="text-yellow-400" />,
        passives: [
          {
            name: "Pulso Preciso",
            description:
              "Realiza un disparo cargado que inflige daño crítico garantizado.",
          },
          {
            name: "Reflejo Ágil",
            description: "Aumenta la velocidad de ataque tras esquivar.",
          },
        ],
      },
      {
        name: "Sanguinario del Linde",
        icon: <FaSpider className="text-green-500" />,
        passives: [
          {
            name: "Olor a sangre",
            description:
              "Inflige más daño a enemigos que están por debajo del 50% de vida",
          },
          {
            name: "Tiro Venenoso",
            description:
              "Dispara una flecha que inflige daño de veneno con el tiempo.",
          },
        ],
      },
    ],
  },
];
