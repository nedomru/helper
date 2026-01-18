import type {Response, SendClientCardRequest} from "../types";

export async function handleSendClientCard(request: SendClientCardRequest): Promise<Response> {
    try {
        const response = await fetch(
            "https://okc.ertelecom.ru/yii/api/line-mail-example/send-example-mail",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                body: `message=${request.payload.message}&lineAppId=3`
            }
        );

        const data = await response.json();
        return {ok: true, data};
    } catch (error) {
        return {ok: false, err: String(error)};
    }
}
