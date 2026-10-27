import os
import sys
import wave
import math
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import pyttsx3
import subprocess

FFMPEG_PATH = r"C:\Program Files (x86)\Labcenter Electronics\Proteus 8 Professional\BIN\ffmpeg.exe"

# Scenes configuration
SCENES = [
    {
        "id": 1,
        "title": "MindBridge AI — Platform Overview",
        "type": "title_card",
        "narration": "Welcome to MindBridge AI, an AI-assisted cognitive screening support and longitudinal monitoring platform designed for cognitive health research.",
        "caption": "MindBridge AI • Cognitive Screening Support & Longitudinal Monitoring",
        "subcaption": "Investigational Research Platform • Protocol MB-2026 • Non-Diagnostic",
        "duration": 12.0
    },
    {
        "id": 2,
        "title": "The Clinical Challenge",
        "type": "screen_pan",
        "image": "01_landing.png",
        "narration": "Traditional paper cognitive screenings are administered infrequently and fail to capture millisecond reaction times, leading to diagnostic delays and demographic bias.",
        "caption": "The Clinical Challenge: Episodic paper tests miss subtle longitudinal latency shifts.",
        "duration": 18.0
    },
    {
        "id": 3,
        "title": "Accessible Onboarding & Informed Consent",
        "type": "screen_pan",
        "image": "03_consent.png",
        "narration": "MindBridge AI begins with accessible onboarding featuring dark mode, text scaling, and a cryptographic SHA-256 informed consent protocol adhering to IRB guidelines.",
        "caption": "Accessible Onboarding: Cryptographic SHA-256 informed consent under IRB Protocol MB-2026.",
        "duration": 20.0
    },
    {
        "id": 4,
        "title": "Interactive Cognitive Battery",
        "type": "screen_dual",
        "image1": "04_battery.png",
        "image2": "05_active_task.png",
        "narration": "The platform features five computerized paradigms: Word Recall, Adaptive Digit Span, Stroop Color-Word Interference, Trail Making B, and Category Fluency, capturing accuracy and latency with millisecond precision.",
        "caption": "5 Computerized Paradigms: Capturing trial accuracy and millisecond response latency.",
        "duration": 24.0
    },
    {
        "id": 5,
        "title": "Normative Radar & Longitudinal Tracking",
        "type": "screen_dual",
        "image1": "06_participant_radar.png",
        "image2": "07_participant_trends.png",
        "narration": "Raw scores are automatically adjusted for age and education to generate normative Z-scores, visual radar profiles, and longitudinal trend lines without alarmist diagnostic labels.",
        "caption": "Normative Profiling: Age & education-adjusted Z-scores with interactive Plotly radar charts.",
        "duration": 22.0
    },
    {
        "id": 6,
        "title": "Clinician Portal & Healthcare Integration",
        "type": "screen_pan",
        "image": "08_clinician_portal.png",
        "narration": "In the Clinician Portal, licensed providers track participant cohorts, record external validated scores like MoCA, and export structured screening summaries for medical consultations.",
        "caption": "Clinician Portal: Cohort roster tracking, external MoCA recording, and exportable reports.",
        "duration": 20.0
    },
    {
        "id": 7,
        "title": "Exasol Personal & Transparent Fallback",
        "type": "screen_pan",
        "image": "02_diagnostics.png",
        "narration": "Exasol Personal provides an in-memory columnar database for instant longitudinal SQL queries, with an explicit mock adapter ensuring transparency during development.",
        "caption": "Exasol Personal: In-memory columnar SQL analytics with verified fallback integrity.",
        "duration": 20.0
    },
    {
        "id": 8,
        "title": "Research ML & Subgroup Fairness Audit",
        "type": "screen_pan",
        "image": "09_research_ml.png",
        "narration": "Our research pipeline features a calibrated Random Forest classifier achieving an 0.88 ROC-AUC, paired with an automated Subgroup Fairness Audit across age brackets.",
        "caption": "Responsible ML: Calibrated classifier with automated demographic subgroup fairness auditing.",
        "duration": 22.0
    },
    {
        "id": 9,
        "title": "Closing & Product Vision",
        "type": "closing_card",
        "narration": "MindBridge AI empowers clinicians and researchers with objective, longitudinal cognitive data. Thank you for exploring MindBridge AI.",
        "caption": "MindBridge AI • Making cognitive performance easier to understand, track, and discuss.",
        "subcaption": "Contact & Collaboration: Cognitive Health Research Team • Version 1.0.0",
        "duration": 14.0
    }
]

def format_srt_time(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

def generate_srt_file(output_path: Path):
    lines = []
    current_time = 0.0
    for idx, scene in enumerate(SCENES, 1):
        start_t = current_time
        end_t = current_time + scene["duration"]
        lines.append(str(idx))
        lines.append(f"{format_srt_time(start_t)} --> {format_srt_time(end_t)}")
        lines.append(scene["caption"])
        lines.append("")
        current_time = end_t
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"SRT saved: {output_path}")

def generate_script_markdown(output_path: Path):
    md = [
        "# MindBridge AI — Product Demonstration Video Script",
        "",
        "**Target Video Duration:** ~2 minutes 52 seconds (172 seconds)  ",
        "**Aspect Ratio:** 16:9 (1920x1080 Full HD)  ",
        "**Audio Narration:** Text-to-Speech synthesis (pyttsx3)  ",
        "**Subtitles:** Embedded Burned Captions & Synchronized `.srt` Subtitles  ",
        "",
        "---",
        ""
    ]
    current_time = 0.0
    for idx, scene in enumerate(SCENES, 1):
        start_t = current_time
        end_t = current_time + scene["duration"]
        start_str = f"{int(start_t//60):02d}:{int(start_t%60):02d}"
        end_str = f"{int(end_t//60):02d}:{int(end_t%60):02d}"
        md.append(f"### Scene {idx}: {scene['title']} ({start_str} – {end_str})")
        md.append(f"- **Visual Focus:** {scene.get('type', 'Screen Demonstration')} ({scene.get('image', scene.get('image1', 'Graphic Title Card'))})")
        md.append(f"- **Spoken Narration:** \"{scene['narration']}\"")
        md.append(f"- **Burned Caption:** `{scene['caption']}`")
        if "subcaption" in scene:
            md.append(f"- **Subtitle Details:** `{scene['subcaption']}`")
        md.append("")
        current_time = end_t

    md.append("---")
    md.append("## Regulatory Boundary & Clinical Safeguards Note")
    md.append("MindBridge AI is an investigational screening support platform and longitudinal research tool. It does not provide medical diagnoses of Alzheimer's disease or dementia.")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(f"Script saved: {output_path}")

def generate_scene_audio(scene, temp_wav_path):
    engine = pyttsx3.init()
    engine.setProperty('rate', 150) # Natural pacing
    engine.save_to_file(scene["narration"], str(temp_wav_path))
    engine.runAndWait()

def build_full_audio(output_wav_path: Path):
    temp_dir = Path("output/temp_audio")
    temp_dir.mkdir(parents=True, exist_ok=True)
    scene_wavs = []
    sample_rate = 22050

    for idx, scene in enumerate(SCENES):
        clip_path = temp_dir / f"scene_{idx+1}.wav"
        generate_scene_audio(scene, clip_path)
        
        # Read clip audio
        with wave.open(str(clip_path), "rb") as wf:
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            n_frames = wf.getnframes()
            audio_data = wf.readframes(n_frames)
            sample_rate = framerate

        # Pad with silence to match exact scene duration
        target_frames = int(scene["duration"] * framerate)
        current_frames = n_frames
        if current_frames < target_frames:
            silence_frames = target_frames - current_frames
            silence_bytes = b"\x00" * (silence_frames * n_channels * sampwidth)
            audio_data += silence_bytes
        else:
            audio_data = audio_data[:target_frames * n_channels * sampwidth]

        scene_wavs.append((audio_data, n_channels, sampwidth, framerate))

    # Write combined audio file
    with wave.open(str(output_wav_path), "wb") as out_wf:
        out_wf.setnchannels(scene_wavs[0][1])
        out_wf.setsampwidth(scene_wavs[0][2])
        out_wf.setframerate(scene_wavs[0][3])
        for data, _, _, _ in scene_wavs:
            out_wf.writeframes(data)
    print(f"Full narration audio saved: {output_wav_path}")

def draw_burned_caption(img: np.ndarray, title: str, caption: str) -> np.ndarray:
    """Draws sleek healthcare UI lower-third banner with subtitle on frame"""
    h, w, _ = img.shape
    # Bottom banner box
    banner_h = 110
    banner_y = h - banner_h - 20
    banner_x = 80
    banner_w = w - 160

    # Draw semi-transparent dark container
    overlay = img.copy()
    cv2.rectangle(overlay, (banner_x, banner_y), (banner_x + banner_w, banner_y + banner_h), (15, 23, 42), -1)
    cv2.addWeighted(overlay, 0.88, img, 0.12, 0, img)
    # Teal left accent indicator
    cv2.rectangle(img, (banner_x, banner_y), (banner_x + 8, banner_y + banner_h), (166, 184, 20), -1)
    # Border
    cv2.rectangle(img, (banner_x, banner_y), (banner_x + banner_w, banner_y + banner_h), (60, 80, 110), 1)

    # Convert to PIL to draw clean text
    pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)

    try:
        font_title = ImageFont.truetype("segoeui.ttf", 20)
        font_cap = ImageFont.truetype("segoeui.ttf", 26)
    except Exception:
        font_title = ImageFont.load_default()
        font_cap = ImageFont.load_default()

    draw.text((banner_x + 25, banner_y + 14), title.upper(), font=font_title, fill=(165, 180, 252))
    draw.text((banner_x + 25, banner_y + 45), caption, font=font_cap, fill=(248, 250, 252))

    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

def render_title_frame(title: str, subtitle: str, disclaimer: str, progress: float) -> np.ndarray:
    w, h = 1920, 1080
    frame = np.zeros((h, w, 3), dtype=np.uint8)
    frame[:] = (43, 19, 11) # BGR for Dark Navy #0B132B

    pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)
    try:
        f_badge = ImageFont.truetype("segoeui.ttf", 22)
        f_main = ImageFont.truetype("segoeuib.ttf", 64)
        f_sub = ImageFont.truetype("segoeui.ttf", 32)
        f_desc = ImageFont.truetype("segoeui.ttf", 22)
        f_disc = ImageFont.truetype("segoeui.ttf", 18)
    except Exception:
        f_badge = f_main = f_sub = f_desc = f_disc = ImageFont.load_default()

    # Draw badges
    draw.rounded_rectangle([150, 200, 480, 245], radius=8, fill=(28, 37, 65), outline=(20, 184, 166), width=2)
    draw.text((170, 210), "HEALTHCARE AI PLATFORM", font=f_badge, fill=(20, 184, 166))

    draw.rounded_rectangle([510, 200, 830, 245], radius=8, fill=(28, 37, 65), outline=(165, 180, 252), width=2)
    draw.text((530, 210), "EXASOL PERSONAL POWERED", font=f_badge, fill=(165, 180, 252))

    # Main Titles
    draw.text((150, 280), "MindBridge AI", font=f_main, fill=(255, 255, 255))
    draw.text((150, 370), "Cognitive Screening Support & Longitudinal Monitoring", font=f_sub, fill=(165, 180, 252))
    draw.text((150, 435), "Interactive Computerized Battery • High-Performance Columnar SQL • Audited Algorithmic Fairness", font=f_desc, fill=(148, 163, 184))

    # 3 Summary Cards
    cards = [
        ("5 Cognitive Paradigms", "Episodic Recall, Digit Span, Stroop & Trail B"),
        ("Exasol Personal Engine", "In-Memory Columnar SQL Analytics (Port 8563)"),
        ("Clinician Oversight", "Demographic Z-Scores & Non-Diagnostic Guardrails")
    ]
    for idx, (head, sub) in enumerate(cards):
        cx = 150 + idx * 540
        draw.rounded_rectangle([cx, 530, cx + 500, 680], radius=12, fill=(24, 32, 56), outline=(46, 61, 95), width=2)
        draw.text((cx + 25, 555), head, font=f_sub, fill=(20, 184, 166))
        draw.text((cx + 25, 610), sub, font=f_desc, fill=(248, 250, 252))

    # Regulatory callout
    draw.rounded_rectangle([150, 740, 1770, 840], radius=10, fill=(30, 20, 30), outline=(244, 63, 94), width=1)
    draw.text((180, 755), "REGULATORY & CLINICAL BOUNDARY NOTICE:", font=f_desc, fill=(244, 63, 94))
    draw.text((180, 790), "MindBridge AI is an investigational screening support instrument and longitudinal research tool. It does not provide medical diagnoses of Alzheimer's disease.", font=f_disc, fill=(148, 163, 184))

    # Footer
    draw.text((150, 1000), "Protocol MB-2026 • Verified Platform Demonstration • October 2026", font=f_disc, fill=(100, 116, 139))

    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

def render_closing_frame() -> np.ndarray:
    w, h = 1920, 1080
    frame = np.zeros((h, w, 3), dtype=np.uint8)
    frame[:] = (43, 19, 11)

    pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)
    try:
        f_main = ImageFont.truetype("segoeuib.ttf", 56)
        f_sub = ImageFont.truetype("segoeui.ttf", 28)
        f_card_h = ImageFont.truetype("segoeuib.ttf", 24)
        f_card_t = ImageFont.truetype("segoeui.ttf", 20)
    except Exception:
        f_main = f_sub = f_card_h = f_card_t = ImageFont.load_default()

    draw.text((150, 180), "MindBridge AI", font=f_main, fill=(255, 255, 255))
    draw.text((150, 260), "Making cognitive performance easier to understand, track, and discuss.", font=f_sub, fill=(165, 180, 252))

    # 4 Phased Roadmap Cards
    phases = [
        ("Phase 1: Working Prototype", "Completed & Verified\n• 5 computerized tasks\n• FastAPI + pyexasol\n• 11/11 tests passing"),
        ("Phase 2: Older Adult Usability", "Target: Q1 2027\n• Formative ergonomics\n• Older adults (60-85)\n• SUS target > 82"),
        ("Phase 3: Research Cohort", "Target: Q3 2027\n• Multi-site (n=500)\n• 12-month longitudinal\n• Retest reliability r > .85"),
        ("Phase 4: Clinical Triage", "Target: 2028\n• Clinician-supervised\n• EHR HL7/FHIR exchange\n• Multi-node Exasol cluster")
    ]
    for idx, (head, body) in enumerate(phases):
        cx = 150 + idx * 410
        draw.rounded_rectangle([cx, 360, cx + 380, 680], radius=12, fill=(24, 32, 56), outline=(46, 61, 95), width=2)
        draw.text((cx + 20, 385), head, font=f_card_h, fill=(20, 184, 166))
        draw.text((cx + 20, 445), body, font=f_card_t, fill=(248, 250, 252))

    # Collaboration Box
    draw.rounded_rectangle([150, 730, 1770, 860], radius=12, fill=(28, 37, 65), outline=(165, 180, 252), width=1)
    draw.text((180, 755), "COLLABORATION & RESEARCH INQUIRIES:", font=f_card_h, fill=(165, 180, 252))
    draw.text((180, 800), "Open to partnerships with academic neurology departments, clinical trial centers, and database engineering teams.", font=f_card_t, fill=(248, 250, 252))

    draw.text((150, 1000), "MindBridge AI v1.0.0 • Production Demonstration Complete", font=f_card_t, fill=(100, 116, 139))
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

def render_pan_frame(img: Image.Image, progress: float) -> np.ndarray:
    """Creates a gentle, cinematic pan & zoom over the screenshot"""
    target_w, target_h = 1920, 1080
    orig_w, orig_h = img.size

    # Fit image maintaining aspect ratio with top/bottom padding or slight zoom
    scale = max(target_w / orig_w, target_h / orig_h)
    new_w = int(orig_w * scale * 1.06)
    new_h = int(orig_h * scale * 1.06)
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Smooth vertical pan calculation
    max_dy = max(0, new_h - target_h)
    max_dx = max(0, new_w - target_w)
    dy = int(max_dy * progress * 0.8)
    dx = int(max_dx * 0.5)

    cropped = resized.crop((dx, dy, dx + target_w, dy + target_h))
    return cv2.cvtColor(np.array(cropped), cv2.COLOR_RGB2BGR)

def render_dual_frame(img1: Image.Image, img2: Image.Image, progress: float) -> np.ndarray:
    """Renders side-by-side comparison with smooth fade-in"""
    w, h = 1920, 1080
    frame = np.zeros((h, w, 3), dtype=np.uint8)
    frame[:] = (43, 19, 11)

    pane_w, pane_h = 820, 800
    r1 = img1.resize((pane_w, pane_h), Image.Resampling.LANCZOS)
    r2 = img2.resize((pane_w, pane_h), Image.Resampling.LANCZOS)

    c1 = cv2.cvtColor(np.array(r1), cv2.COLOR_RGB2BGR)
    c2 = cv2.cvtColor(np.array(r2), cv2.COLOR_RGB2BGR)

    frame[120:120+pane_h, 100:100+pane_w] = c1
    frame[120:120+pane_h, 1000:1000+pane_w] = c2

    # Draw framing outlines
    cv2.rectangle(frame, (98, 118), (102 + pane_w, 122 + pane_h), (46, 61, 95), 2)
    cv2.rectangle(frame, (998, 118), (1002 + pane_w, 122 + pane_h), (46, 61, 95), 2)
    return frame

def produce_demo_video():
    output_dir = Path("output")
    screenshots_dir = output_dir / "screenshots"
    output_dir.mkdir(parents=True, exist_ok=True)

    srt_path = output_dir / "MindBridge_AI_Demo.srt"
    script_path = output_dir / "MindBridge_AI_Demo_Script.md"
    temp_wav_path = output_dir / "narration_audio.wav"
    raw_video_path = output_dir / "temp_raw_video.mp4"
    final_video_path = output_dir / "MindBridge_AI_Demo.mp4"

    # Step 1: Generate SRT & Script files
    generate_srt_file(srt_path)
    generate_script_markdown(script_path)

    # Step 2: Generate narration audio
    print("Synthesizing audio narration with pyttsx3...")
    build_full_audio(temp_wav_path)

    # Step 3: Render video frames
    fps = 24
    width, height = 1920, 1080
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(raw_video_path), fourcc, fps, (width, height))

    print("Rendering video frames with burned captions and UI transitions...")
    cached_images = {}
    for img_file in screenshots_dir.glob("*.png"):
        cached_images[img_file.name] = Image.open(img_file).convert("RGB")

    for scene in SCENES:
        total_frames = int(scene["duration"] * fps)
        stype = scene["type"]
        title = scene["title"]
        caption = scene["caption"]

        for f in range(total_frames):
            prog = f / max(1, total_frames)

            if stype == "title_card":
                frame = render_title_frame(scene["caption"], scene.get("subcaption", ""), "", prog)
            elif stype == "closing_card":
                frame = render_closing_frame()
                frame = draw_burned_caption(frame, title, caption)
            elif stype == "screen_pan":
                img_key = scene["image"]
                img = cached_images.get(img_key, None)
                if img:
                    frame = render_pan_frame(img, prog)
                else:
                    frame = np.zeros((height, width, 3), dtype=np.uint8)
                frame = draw_burned_caption(frame, title, caption)
            elif stype == "screen_dual":
                img1 = cached_images.get(scene["image1"])
                img2 = cached_images.get(scene["image2"])
                if img1 and img2:
                    frame = render_dual_frame(img1, img2, prog)
                else:
                    frame = np.zeros((height, width, 3), dtype=np.uint8)
                frame = draw_burned_caption(frame, title, caption)
            else:
                frame = np.zeros((height, width, 3), dtype=np.uint8)

            # Apply gentle cross-fade transition at scene start (first 10 frames)
            if f < 10:
                alpha = f / 10.0
                frame = cv2.convertScaleAbs(frame, alpha=alpha)

            out.write(frame)

    out.release()
    print("Raw video rendering complete.")

    # Step 4: Merge audio and video via FFmpeg
    print("Merging video and audio with FFmpeg...")
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-i", str(raw_video_path),
        "-i", str(temp_wav_path),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(final_video_path)
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print("FFmpeg stderr:", result.stderr)
        raise RuntimeError("FFmpeg video encoding failed.")

    print(f"Final MP4 Video created: {final_video_path}")
    print(f"File size: {final_video_path.stat().st_size / (1024*1024):.2f} MB")

    # Cleanup temporary raw video
    if raw_video_path.exists():
        raw_video_path.unlink()
    if temp_wav_path.exists():
        temp_wav_path.unlink()

if __name__ == "__main__":
    produce_demo_video()
