"""
Telegram Bot Service
Handles all bot interactions and command processing
"""

import asyncio
from typing import Optional, Dict, Any
from telegram import Update, Bot, InlineKeyboardButton, InlineKeyboardMarkup  # type: ignore
from telegram.ext import (  # type: ignore
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)
from loguru import logger  # type: ignore

from app.config import settings
from app.services.auth_service import auth_service
from app.services.memory_service import memory_service
from app.services.image_analysis_service import analyze_image_from_url
from app.database import get_db_pool


class TelegramBotService:
    """Telegram bot service for MemoryVault integration"""
    
    def __init__(self):
        self.bot: Optional[Bot] = None
        self.application: Optional[Application] = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize the Telegram bot"""
        if self._initialized:
            return
        
        try:
            # Create bot application
            self.application = (
                Application.builder()
                .token(settings.TELEGRAM_BOT_TOKEN)
                .build()
            )
            
            self.bot = self.application.bot
            
            # Register command handlers
            self.application.add_handler(CommandHandler("start", self.cmd_start))
            self.application.add_handler(CommandHandler("connect", self.cmd_connect))
            self.application.add_handler(CommandHandler("status", self.cmd_status))
            self.application.add_handler(CommandHandler("add", self.cmd_add))
            self.application.add_handler(CommandHandler("list", self.cmd_list))
            self.application.add_handler(CommandHandler("search", self.cmd_search))
            self.application.add_handler(CommandHandler("help", self.cmd_help))
            
            # Message handlers for adding memories
            self.application.add_handler(
                MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_text_message)
            )
            self.application.add_handler(
                MessageHandler(filters.PHOTO, self.handle_photo_message)
            )
            self.application.add_handler(
                MessageHandler(filters.Document.ALL, self.handle_document_message)
            )
            
            # Initialize the application
            await self.application.initialize()
            
            self._initialized = True
            logger.info("✓ Telegram bot service initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize Telegram bot: {e}")
            raise
    
    async def shutdown(self):
        """Shutdown the bot"""
        if self.application:
            await self.application.shutdown()
            logger.info("✓ Telegram bot shut down")
    
    async def process_update(self, update: Update):
        """Process incoming update from Telegram"""
        try:
            await self.application.process_update(update)
        except Exception as e:
            logger.error(f"Error processing update: {e}")
    
    async def set_webhook(self, url: str) -> bool:
        """Set webhook URL"""
        try:
            await self.bot.set_webhook(url=url)
            logger.info(f"✓ Webhook set to: {url}")
            return True
        except Exception as e:
            logger.error(f"Failed to set webhook: {e}")
            return False
    
    async def remove_webhook(self) -> bool:
        """Remove webhook"""
        try:
            await self.bot.delete_webhook()
            logger.info("✓ Webhook removed")
            return True
        except Exception as e:
            logger.error(f"Failed to remove webhook: {e}")
            return False
    
    async def get_bot_info(self) -> Optional[Dict[str, Any]]:
        """Get bot information"""
        try:
            me = await self.bot.get_me()
            return {
                "id": me.id,
                "username": me.username,
                "first_name": me.first_name,
                "can_read_all_group_messages": me.can_read_all_group_messages,
            }
        except Exception as e:
            logger.error(f"Failed to get bot info: {e}")
            return None
    
    # Command Handlers
    
    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.effective_user
        
        welcome_message = f"""
👋 Welcome to **MemoryVault Bot**, {user.first_name}!

I help you manage your memories directly from Telegram.

**Getting Started:**
1. Connect your MemoryVault account using `/connect <code>`
2. Get your connection code from the MemoryVault app (Integrations page)

**Available Commands:**
/connect - Link your MemoryVault account
/status - Check connection status
/add - Add a new memory
/list - View recent memories
/search - Search memories
/help - Show this help message

Let's get started! 🚀
        """
        
        await update.message.reply_text(
            welcome_message,
            parse_mode="Markdown"
        )
    
    async def cmd_connect(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /connect command"""
        telegram_user_id = str(update.effective_user.id)
        
        # Check if already connected
        db = await get_db_pool()
        is_connected = await auth_service.is_user_connected(telegram_user_id, db)
        
        if is_connected:
            await update.message.reply_text(
                "✅ You're already connected to MemoryVault!\n\n"
                "Use /status to check your connection details."
            )
            return
        
        # Get auth code from command args
        if not context.args or len(context.args) == 0:
            await update.message.reply_text(
                "❌ Please provide an authentication code.\n\n"
                "**Usage:** `/connect <code>`\n\n"
                "Get your code from: Settings → Integrations → Telegram",
                parse_mode="Markdown"
            )
            return
        
        auth_code = context.args[0].strip().upper()
        
        # Verify and connect
        try:
            result = await auth_service.verify_and_connect(
                auth_code=auth_code,
                telegram_user_id=telegram_user_id,
                telegram_username=update.effective_user.username,
                telegram_first_name=update.effective_user.first_name,
                telegram_last_name=update.effective_user.last_name,
                db=db
            )
            
            if result["success"]:
                await update.message.reply_text(
                    "✅ **Connected Successfully!**\n\n"
                    "Your Telegram account is now linked to MemoryVault.\n\n"
                    "You can now:\n"
                    "• Add memories by sending messages\n"
                    "• View memories with /list\n"
                    "• Search memories with /search\n\n"
                    "Type /help for more commands.",
                    parse_mode="Markdown"
                )
            else:
                await update.message.reply_text(
                    f"❌ **Connection Failed**\n\n{result['error']}\n\n"
                    "Please get a new code from the MemoryVault app.",
                    parse_mode="Markdown"
                )
        except Exception as e:
            logger.error(f"Error in connect command: {e}")
            await update.message.reply_text(
                "❌ An error occurred. Please try again later."
            )
    
    async def cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command"""
        telegram_user_id = str(update.effective_user.id)
        db = await get_db_pool()
        
        try:
            status = await auth_service.get_connection_status_by_telegram(
                telegram_user_id, db
            )
            
            if status["connected"]:
                memory_count = await memory_service.get_memory_count(
                    status["user_id"], db
                )
                
                await update.message.reply_text(
                    f"✅ **Connected to MemoryVault**\n\n"
                    f"📊 **Statistics:**\n"
                    f"• Total Memories: {memory_count}\n"
                    f"• Connected Since: {status['connected_at']}\n\n"
                    f"🔗 Open MemoryVault: {settings.APP_BASE_URL}",
                    parse_mode="Markdown"
                )
            else:
                await update.message.reply_text(
                    "❌ **Not Connected**\n\n"
                    "Use `/connect <code>` to link your account.\n"
                    "Get your code from the MemoryVault app.",
                    parse_mode="Markdown"
                )
        except Exception as e:
            logger.error(f"Error in status command: {e}")
            await update.message.reply_text(
                "❌ An error occurred while checking status."
            )
    
    async def cmd_add(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /add command"""
        await update.message.reply_text(
            "📝 **Add a Memory**\n\n"
            "Simply send me:\n"
            "• Text message for a text memory\n"
            "• Photo with caption\n"
            "• Document/file\n\n"
            "I'll save it to your MemoryVault automatically!",
            parse_mode="Markdown"
        )
    
    async def cmd_list(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /list command"""
        telegram_user_id = str(update.effective_user.id)
        db = await get_db_pool()
        
        # Check if connected
        status = await auth_service.get_connection_status_by_telegram(
            telegram_user_id, db
        )
        
        if not status["connected"]:
            await update.message.reply_text(
                "❌ Please connect your account first using `/connect <code>`",
                parse_mode="Markdown"
            )
            return
        
        try:
            # Get recent memories
            memories = await memory_service.get_recent_memories(
                status["user_id"], limit=10, db=db
            )
            
            if not memories:
                await update.message.reply_text(
                    "📭 No memories yet.\n\nSend me a message to create your first memory!"
                )
                return
            
            message = "📚 **Your Recent Memories:**\n\n"
            
            for i, mem in enumerate(memories, 1):
                title = mem["title"][:50] + "..." if len(mem["title"]) > 50 else mem["title"]
                date = mem["created_at"].strftime("%b %d, %Y")
                message += f"{i}. **{title}**\n   _{date}_\n\n"
            
            message += f"\n🔗 View all: {settings.APP_BASE_URL}/memories"
            
            await update.message.reply_text(message, parse_mode="Markdown")
            
        except Exception as e:
            logger.error(f"Error in list command: {e}")
            await update.message.reply_text(
                "❌ An error occurred while fetching memories."
            )
    
    async def cmd_search(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /search command"""
        telegram_user_id = str(update.effective_user.id)
        db = await get_db_pool()
        
        # Check if connected
        status = await auth_service.get_connection_status_by_telegram(
            telegram_user_id, db
        )
        
        if not status["connected"]:
            await update.message.reply_text(
                "❌ Please connect your account first using `/connect <code>`",
                parse_mode="Markdown"
            )
            return
        
        # Get search query
        if not context.args or len(context.args) == 0:
            await update.message.reply_text(
                "🔍 **Search Memories**\n\n"
                "**Usage:** `/search <query>`\n\n"
                "**Example:** `/search birthday party`",
                parse_mode="Markdown"
            )
            return
        
        query = " ".join(context.args)
        
        try:
            # Search memories
            results = await memory_service.search_memories(
                status["user_id"], query, limit=5, db=db
            )
            
            if not results:
                await update.message.reply_text(
                    f"🔍 No results found for: *{query}*",
                    parse_mode="Markdown"
                )
                return
            
            message = f"🔍 **Search Results for:** *{query}*\n\n"
            
            for i, mem in enumerate(results, 1):
                title = mem["title"][:50] + "..." if len(mem["title"]) > 50 else mem["title"]
                date = mem["created_at"].strftime("%b %d, %Y")
                message += f"{i}. **{title}**\n   _{date}_\n\n"
            
            await update.message.reply_text(message, parse_mode="Markdown")
            
        except Exception as e:
            logger.error(f"Error in search command: {e}")
            await update.message.reply_text(
                "❌ An error occurred while searching."
            )
    
    async def cmd_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        help_text = """
📖 **MemoryVault Bot Commands**

**Account Management:**
/connect <code> - Link your MemoryVault account
/status - Check connection status

**Memory Management:**
/add - Instructions to add memories
/list - View recent memories (last 10)
/search <query> - Search your memories

**Other:**
/help - Show this help message

**Quick Tips:**
• Send any text to create a memory
• Send photos with captions
• Send documents or files
• All memories are automatically synced with your MemoryVault app

Need help? Visit: {settings.APP_BASE_URL}
        """
        
        await update.message.reply_text(help_text, parse_mode="Markdown")
    
    # Message Handlers
    
    async def handle_text_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle regular text messages"""
        telegram_user_id = str(update.effective_user.id)
        db = await get_db_pool()
        
        # Check if connected
        status = await auth_service.get_connection_status_by_telegram(
            telegram_user_id, db
        )
        
        if not status["connected"]:
            await update.message.reply_text(
                "❌ Please connect your account first using `/connect <code>`\n\n"
                "Get your code from: {settings.APP_BASE_URL}/integrations",
                parse_mode="Markdown"
            )
            return
        
        try:
            # Create memory
            text = update.message.text
            result = await memory_service.create_memory_from_telegram(
                user_id=status["user_id"],
                title=text[:100],  # Use first 100 chars as title
                content=text,
                source="telegram",
                db=db
            )
            
            if result["success"]:
                await update.message.reply_text(
                    "✅ Memory saved!\n\n"
                    "🔗 View in app: {settings.APP_BASE_URL}/memories"
                )
            else:
                await update.message.reply_text(
                    "❌ Failed to save memory. Please try again."
                )
                
        except Exception as e:
            logger.error(f"Error handling text message: {e}")
            await update.message.reply_text(
                "❌ An error occurred while saving your memory."
            )
    
    async def handle_photo_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle photo messages with AI analysis"""
        telegram_user_id = str(update.effective_user.id)
        db = await get_db_pool()
        
        # Check if connected
        status = await auth_service.get_connection_status_by_telegram(
            telegram_user_id, db
        )
        
        if not status["connected"]:
            await update.message.reply_text(
                "❌ Please connect your account first using `/connect <code>`",
                parse_mode="Markdown"
            )
            return
        
        try:
            # Send analyzing message
            analyzing_msg = await update.message.reply_text(
                "🔍 Analyzing image with AI...",
                parse_mode="Markdown"
            )
            
            # Get photo
            photo = update.message.photo[-1]  # Largest size
            caption = update.message.caption
            
            # Get file info from Telegram
            file = await photo.get_file()
            file_url = file.file_path
            file_name = f"photo_{photo.file_id}.jpg"
            
            # Analyze image with AI
            analysis = await analyze_image_from_url(file_url, file_name)
            
            # Use AI-generated title and content, or fall back to caption
            title = caption[:100] if caption else analysis["title"]
            content = caption if caption else analysis["content"]
            
            # Create memory with photo
            result = await memory_service.create_memory_with_file(
                user_id=status["user_id"],
                title=title,
                content=content,
                file_path=file_url,
                file_name=file_name,
                file_type="image",
                content_type="image/jpeg",
                source="telegram",
                db=db
            )
            
            # Delete analyzing message
            await analyzing_msg.delete()
            
            if result["success"]:
                # Show what was detected
                response = "✅ **Photo saved to MemoryVault!**\n\n"
                
                if analysis["confidence"] > 0:
                    response += f"**AI Analysis:**\n"
                    response += f"📝 *{analysis['title']}*\n"
                    if analysis['content']:
                        response += f"💬 {analysis['content'][:100]}...\n"
                    if analysis['tags']:
                        response += f"🏷️ {', '.join(analysis['tags'][:3])}\n"
                
                response += f"\n🔗 View: {settings.APP_BASE_URL}/memories"
                
                await update.message.reply_text(response, parse_mode="Markdown")
            else:
                await update.message.reply_text("❌ Failed to save photo.")
                
        except Exception as e:
            logger.error(f"Error handling photo: {e}")
            await update.message.reply_text(
                "❌ An error occurred while saving your photo."
            )
    
    async def handle_document_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle document messages"""
        telegram_user_id = str(update.effective_user.id)
        db = await get_db_pool()
        
        # Check if connected
        status = await auth_service.get_connection_status_by_telegram(
            telegram_user_id, db
        )
        
        if not status["connected"]:
            await update.message.reply_text(
                "❌ Please connect your account first using `/connect <code>`",
                parse_mode="Markdown"
            )
            return
        
        try:
            # Get document
            document = update.message.document
            caption = update.message.caption or document.file_name
            
            # Get file info from Telegram
            file = await document.get_file()
            file_path = file.file_path
            
            # Determine content type
            content_type = document.mime_type or "application/octet-stream"
            
            # Create memory with document
            result = await memory_service.create_memory_with_file(
                user_id=status["user_id"],
                title=caption[:100],
                content=caption,
                file_path=file_path,
                file_name=document.file_name,
                file_type="document",
                content_type=content_type,
                source="telegram",
                db=db
            )
            
            if result["success"]:
                await update.message.reply_text(
                    "✅ Document saved to your MemoryVault!"
                )
            else:
                await update.message.reply_text(
                    "❌ Failed to save document."
                )
                
        except Exception as e:
            logger.error(f"Error handling document: {e}")
            await update.message.reply_text(
                "❌ An error occurred while saving your document."
            )


# Global service instance
telegram_service = TelegramBotService()
