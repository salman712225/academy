import httpx
import logging
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status

logger = logging.getLogger("ai_llm_client")

async def call_llm(
    provider: str,
    api_key: str,
    prompt: str,
    system_instruction: Optional[str] = None,
    response_format_json: bool = False
) -> str:
    """
    Calls the specified LLM provider with the given prompt and system instructions.
    Returns the text response.
    """
    provider = provider.lower().strip()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"API Key for provider '{provider}' is missing or empty."
        )

    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            if provider == "openai":
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "temperature": 0.3
                }
                if response_format_json:
                    payload["response_format"] = {"type": "json_object"}

                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"OpenAI error: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"OpenAI API error: {response.text}"
                    )
                data = response.json()
                return data["choices"][0]["message"]["content"]

            elif provider == "groq":
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.3
                }
                if response_format_json:
                    payload["response_format"] = {"type": "json_object"}

                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Groq error: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Groq API error: {response.text}"
                    )
                data = response.json()
                return data["choices"][0]["message"]["content"]

            elif provider == "mistral":
                url = "https://api.mistral.ai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": "mistral-small-latest",
                    "messages": messages,
                    "temperature": 0.3
                }
                if response_format_json:
                    payload["response_format"] = {"type": "json_object"}

                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Mistral error: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Mistral API error: {response.text}"
                    )
                data = response.json()
                return data["choices"][0]["message"]["content"]

            elif provider == "gemini":
                # We use gemini-1.5-flash as it is fast and supports JSON response
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}
                
                contents = [{
                    "role": "user",
                    "parts": [{"text": prompt}]
                }]
                
                payload = {
                    "contents": contents
                }
                
                if system_instruction:
                    payload["systemInstruction"] = {
                        "parts": [{"text": system_instruction}]
                    }
                    
                generation_config = {}
                if response_format_json:
                    generation_config["responseMimeType"] = "application/json"
                
                if generation_config:
                    payload["generationConfig"] = generation_config

                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Gemini error: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Gemini API error: {response.text}"
                    )
                data = response.json()
                try:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    logger.error(f"Unexpected Gemini response structure: {data}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to parse text from Gemini response."
                    )

            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported LLM provider: {provider}. Please choose Gemini, Groq, Mistral, or OpenAI."
                )

        except httpx.RequestError as e:
            logger.error(f"Network error calling provider {provider}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Network error connecting to {provider}: {str(e)}"
            )
