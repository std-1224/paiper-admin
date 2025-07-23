import * as React from "react";

interface SignupEmailTemplateProps {
  firstName?: string;
}

interface OrderEmailTemplateProps {
  firstName?: string;
  orderNumber: number;
}

interface BalanceEmailTemplateProps {
  firstName?: string;
  balance: number;
}

interface ReminderEmailTemplateProps {
  firstName?: string;
}

export const SignupEmailTemplate: React.FC<
  Readonly<SignupEmailTemplateProps>
> = ({ firstName = "" }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Gracias por registrarte en Payper App. Ya puedes explorar nuestros menús
      exclusivos, realizar pedidos y disfrutar de una experiencia única en
      nuestros bares y eventos. ¡Bienvenido!
    </p>
  </div>
);

export const NewOrderEmailTemplate: React.FC<
  Readonly<OrderEmailTemplateProps>
> = ({ firstName = "", orderNumber }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Hemos recibido tu pedido #{orderNumber}. Nuestro equipo está preparando
      todo para que lo disfrutes cuanto antes. Gracias por elegirnos.
    </p>
  </div>
);

export const OrderDeliveredEmailTemplate: React.FC<
  Readonly<OrderEmailTemplateProps>
> = ({ firstName = "", orderNumber }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Tu pedido #{orderNumber} ha sido entregado. Esperamos que lo disfrutes. Si
      tienes alguna duda, estamos para ayudarte.
    </p>
  </div>
);

export const OrderCancelledEmailTemplate: React.FC<
  Readonly<OrderEmailTemplateProps>
> = ({ firstName = "", orderNumber }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Lamentamos informarte que tu pedido #{orderNumber} ha sido cancelado. Si
      tienes preguntas, por favor contáctanos para asistirte.
    </p>
  </div>
);

export const OrderDelayedEmailTemplate: React.FC<
  Readonly<OrderEmailTemplateProps>
> = ({ firstName = "", orderNumber }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Queremos informarte que tu pedido #{orderNumber} está demorándose más de
      lo esperado. Estamos trabajando para que llegue pronto. Gracias por tu
      paciencia.
    </p>
  </div>
);

export const BalanceUpdatedEmailTemplate: React.FC<
  Readonly<BalanceEmailTemplateProps>
> = ({ firstName = "", balance }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Tu cuenta ha sido actualizada con un nuevo saldo de {balance}. Ahora
      puedes usarlo para realizar tus pedidos y disfrutar de nuestros servicios.
      ¡Gracias por confiar en nosotros!
    </p>
  </div>
);

export const ReminderEmailTemplate: React.FC<
  Readonly<ReminderEmailTemplateProps>
> = ({ firstName = "" }) => (
  <div>
    <h3>Hola {firstName ? `, ${firstName}` : ""}!</h3>
    <p>
      Tu saldo actual es bajo. Recuerda recargar para seguir disfrutando de
      todos nuestros beneficios sin interrupciones.
    </p>
  </div>
);
