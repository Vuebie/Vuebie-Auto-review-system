import { createClient } from 'npm:@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'npm:openai';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const openai = new OpenAI({ apiKey: openaiApiKey });

// Generate a unique request ID
function generateRequestId() {
  return crypto.randomUUID();
}

serve(async (req) => {
  // Generate a request ID for tracking
  const requestId = generateRequestId();
  console.log(`[${requestId}] Received request: ${req.method}`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    const { qrCodeId, rating = 5, language = 'en', customPrompt = null } = requestBody;
    
    if (!qrCodeId) {
      return new Response(
        JSON.stringify({ error: 'QR code ID is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log(`[${requestId}] Processing review generation for QR code: ${qrCodeId}, language: ${language}`);
    
    // Get QR code and outlet information
    const { data: qrCode, error: qrError } = await supabase
      .from('app_363c640910_qr_codes')
      .select('*, outlets:app_363c640910_outlets(*)')
      .eq('id', qrCodeId)
      .single();

    if (qrError || !qrCode) {
      console.error(`[${requestId}] QR code error:`, qrError);
      return new Response(
        JSON.stringify({ error: 'QR code not found' }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get merchant's AI template for the requested language
    const { data: aiTemplate, error: templateError } = await supabase
      .from('app_363c640910_ai_templates')
      .select('*')
      .eq('merchant_id', qrCode.merchant_id)
      .eq('language', language)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Use default prompt if no template found
    let prompt = '';
    if (customPrompt) {
      prompt = customPrompt;
    } else if (aiTemplate && !templateError) {
      prompt = aiTemplate.prompt;
    } else {
      // Default prompts by language and rating
      const getDefaultPrompt = (lang: string, stars: number, outletName: string) => {
        const prompts = {
          en: {
            5: `Generate a short, authentic 5-star Google review for ${outletName}. The review should sound natural, conversational, and mention specific aspects of the business. Avoid overly formal language or marketing phrases.`,
            4: `Generate a short, authentic 4-star Google review for ${outletName}. The review should sound natural, conversational, mention both positive aspects and small areas for improvement. Keep it mostly positive.`,
            3: `Generate a short, authentic 3-star Google review for ${outletName}. The review should sound natural, conversational, and balanced between positive and negative aspects.`,
            2: `Generate a short, authentic 2-star Google review for ${outletName}. The review should sound natural, conversational, and focus on areas for improvement while still mentioning one positive aspect.`,
            1: `Generate a short, authentic 1-star Google review for ${outletName}. The review should sound natural, conversational, and focus on areas for improvement while being constructive.`
          },
          zh: {
            5: `为${outletName}生成一个简短、真实的5星谷歌评论。评论应该听起来自然、对话式，并提到企业的具体方面。避免过于正式的语言或营销短语。`,
            4: `为${outletName}生成一个简短、真实的4星谷歌评论。评论应该听起来自然、对话式，提到正面方面和小的改进空间。保持大体积极。`,
            3: `为${outletName}生成一个简短、真实的3星谷歌评论。评论应该听起来自然、对话式，平衡正面和负面方面。`,
            2: `为${outletName}生成一个简短、真实的2星谷歌评论。评论应该听起来自然、对话式，并集中在改进领域的同时仍提到一个积极的方面。`,
            1: `为${outletName}生成一个简短、真实的1星谷歌评论。评论应该听起来自然、对话式，并集中在改进领域的同时保持建设性。`
          },
          vi: {
            5: `Tạo đánh giá Google 5 sao ngắn gọn, chân thực cho ${outletName}. Bài đánh giá nên có giọng điệu tự nhiên, mang tính đối thoại và đề cập đến những khía cạnh cụ thể của doanh nghiệp. Tránh ngôn ngữ quá trang trọng hoặc cụm từ tiếp thị.`,
            4: `Tạo đánh giá Google 4 sao ngắn gọn, chân thực cho ${outletName}. Bài đánh giá nên có giọng điệu tự nhiên, mang tính đối thoại, đề cập đến cả các khía cạnh tích cực và các lĩnh vực cần cải thiện nhỏ. Giữ cho nó chủ yếu là tích cực.`,
            3: `Tạo đánh giá Google 3 sao ngắn gọn, chân thực cho ${outletName}. Bài đánh giá nên có giọng điệu tự nhiên, mang tính đối thoại và cân bằng giữa các khía cạnh tích cực và tiêu cực.`,
            2: `Tạo đánh giá Google 2 sao ngắn gọn, chân thực cho ${outletName}. Bài đánh giá nên có giọng điệu tự nhiên, mang tính đối thoại và tập trung vào các lĩnh vực cần cải thiện trong khi vẫn đề cập đến một khía cạnh tích cực.`,
            1: `Tạo đánh giá Google 1 sao ngắn gọn, chân thực cho ${outletName}. Bài đánh giá nên có giọng điệu tự nhiên, mang tính đối thoại và tập trung vào các lĩnh vực cần cải thiện trong khi vẫn mang tính xây dựng.`
          }
        };
        
        return prompts[lang]?.[stars] || prompts.en[stars] || prompts.en[5];
      };
      
      prompt = getDefaultPrompt(language, rating, qrCode.outlets.name);
    }

    console.log(`[${requestId}] Generating review with AI using prompt template for ${rating} stars`);

    // Generate review with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates authentic-sounding customer reviews for businesses. Generate a short review that sounds like a real customer wrote it. Keep it concise (1-3 sentences), authentic, and focused on the experience that matches a ${rating}-star rating.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const reviewText = response.choices[0].message.content.trim();
    
    // Generate alternative review suggestions if rating is >= 3
    let alternatives = [];
    if (rating >= 3) {
      console.log(`[${requestId}] Generating alternative review suggestions`);
      
      // For higher ratings, generate alternative suggestions
      const alternativesResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates authentic-sounding customer reviews. Generate 2 alternative short reviews that sound like real customers wrote them. Each should be different from each other, keeping to 1-2 sentences, authentic-sounding, and appropriate for a ${rating}-star rating.`
          },
          {
            role: "user",
            content: `Generate 2 alternative ${rating}-star reviews for ${qrCode.outlets.name}. Make them different from this review: "${reviewText}"`
          }
        ],
        temperature: 0.8,
        max_tokens: 250
      });
      
      const alternativesText = alternativesResponse.choices[0].message.content.trim();
      
      // Parse alternatives (assuming they're numbered or in separate lines)
      alternatives = alternativesText
        .split(/\d+\.\s+/)
        .filter(text => text.trim().length > 0)
        .map(text => text.trim())
        .slice(0, 2); // Limit to 2 alternatives
    }
    
    console.log(`[${requestId}] Successfully generated review with ${alternatives.length} alternatives`);

    return new Response(
      JSON.stringify({ 
        review: reviewText,
        alternatives: alternatives,
        language,
        rating,
        merchant_id: qrCode.merchant_id,
        outlet_id: qrCode.outlet_id,
        outlet_name: qrCode.outlets.name
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error processing request:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});