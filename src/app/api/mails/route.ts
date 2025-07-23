import {
  BalanceUpdatedEmailTemplate,
  NewOrderEmailTemplate,
  OrderCancelledEmailTemplate,
  OrderDelayedEmailTemplate,
  OrderDeliveredEmailTemplate,
  ReminderEmailTemplate,
  SignupEmailTemplate,
} from "@/components/EmailTemplate";
import { Resend } from "resend";
import React from "react";
import { MailType } from "@/types/types";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

const getSubject = (type: MailType) => {
  switch (type) {
    case "sign_up":
      return " ¡Bienvenido a Payper App!";
    case "new_order":
      return "Confirmación de tu pedido";
    case "order_delivered":
      return " Pedido entregado con éxito";
    case "order_cancelled":
      return "Pedido cancelado";
    case "order_delayed":
      return "Retraso en tu pedido";
    case "balance_updated":
      return "Actualización de saldo en tu cuenta";
    case "reminder":
      return "Recordatorio de saldo bajo";
    default:
      return "Hola";
  }
};

const getEmailTemplate = (type: MailType, props: any) => {
  switch (type) {
    case "sign_up":
      return SignupEmailTemplate(props);
    case "new_order":
      return NewOrderEmailTemplate(props);
    case "order_delivered":
      return OrderDeliveredEmailTemplate(props);
    case "order_cancelled":
      return OrderCancelledEmailTemplate(props);
    case "order_delayed":
      return OrderDelayedEmailTemplate(props);
    case "balance_updated":
      return BalanceUpdatedEmailTemplate(props);
    case "reminder":
      return ReminderEmailTemplate(props);
  }
};

export async function POST(req: Request) {
  const { email, type, orderNumber, userName, balance } = await req.json();
  try {
    const { data, error } = await resend.emails.send({
      from: "Support <hola@payperapp.io>",
      to: [email],
      subject: getSubject(type),
      react: getEmailTemplate(type, {
        orderNumber,
        balance,
        firstName: userName,
      }) as React.ReactNode,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
