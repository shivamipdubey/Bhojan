import os
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY", "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")
)

# Path to your image
image_path = "/Users/shivam/Desktop/img.jpg"

# Read and encode the image as base64
import base64
with open(image_path, "rb") as image_file:
    image_data = base64.b64encode(image_file.read()).decode("utf-8")

# Determine the media type
if image_path.endswith(".png"):
    media_type = "image/png"
elif image_path.endswith((".jpg", ".jpeg")):
    media_type = "image/jpeg"
else:
    media_type = "image/png"

completion = client.chat.completions.create(
    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{media_type};base64,{image_data}"
                }
            },
            {
                "type": "text",
                "text": "What is in this image?"
            }
        ]
    }],
    temperature=0.6,
    top_p=0.95,
    max_tokens=65536,
    extra_body={"chat_template_kwargs": {"enable_thinking": True}, "reasoning_budget": 16384},
    stream=True
)

for chunk in completion:
    if not chunk.choices:
        continue
    reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
    if reasoning:
        print(reasoning, end="")
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")